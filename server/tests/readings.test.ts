import { beforeEach, describe, expect, it } from 'vitest'
import { todayInAppTimezone } from '../src/utils/dates'
import { api, signUpAndGetToken } from './helpers'

const DATE = '2026-10-15'
let token: string

const auth = () => ({ Authorization: `Bearer ${token}` })
const addReading = (body: object, t = token) =>
  api().post('/readings').set('Authorization', `Bearer ${t}`).send(body)

beforeEach(async () => {
  token = await signUpAndGetToken()
})

describe('POST /readings', () => {
  it('saves a reading and returns it', async () => {
    const res = await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })

    expect(res.status).toBe(201)
    expect(res.body.reading).toEqual({ id: 1, date: DATE, slot: 'AFTER_LUNCH', value: 112 })
  })

  it('shows Kenpath’s messages for a missing or out-of-range value', async () => {
    const missing = await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: '' })
    const tooHigh = await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 601 })

    expect(missing.status).toBe(400)
    expect(missing.body.fields.value).toBe('Please enter a glucose value.')
    expect(tooHigh.body.fields.value).toBe('Value must be between 40 and 600 mg/dl.')
  })

  it('rejects a date in the future (in India time)', async () => {
    const today = todayInAppTimezone()
    const tomorrow = new Date(`${today}T00:00:00Z`)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    const res = await addReading({ date: tomorrow.toISOString().slice(0, 10), slot: 'AFTER_LUNCH', value: 100 })
    const todayRes = await addReading({ date: today, slot: 'AFTER_LUNCH', value: 100 })

    expect(res.status).toBe(400)
    expect(res.body.fields.date).toBe('Date cannot be in the future.')
    expect(todayRes.status).toBe(201)
  })

  it('allows only one reading per slot per day', async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    const res = await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 130 })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('You already have an After lunch reading for this date.')
    expect(res.body.fields.slot).toBe('You already have an After lunch reading for this date.')
  })

  it('allows only 4 readings per day', async () => {
    for (const slot of ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER']) {
      expect((await addReading({ date: DATE, slot, value: 100 })).status).toBe(201)
    }
    const fifth = await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 100 })

    expect(fifth.status).toBe(409)
    expect(fifth.body.error).toBe('You can add only 4 readings per day.')
  })

  it('lets two different users use the same slot on the same day', async () => {
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })

    expect((await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 99 }, otherToken)).status).toBe(201)
  })

  it('requires login', async () => {
    const res = await api().post('/readings').send({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    expect(res.status).toBe(401)
  })
})

describe('GET /readings', () => {
  it('returns only my readings, newest first, with pagination', async () => {
    await addReading({ date: '2026-10-14', slot: 'AFTER_DINNER', value: 140 })
    await addReading({ date: DATE, slot: 'MORNING_FASTING', value: 95 })
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')
    await addReading({ date: DATE, slot: 'AFTER_DINNER', value: 200 }, otherToken)

    const page1 = await api().get('/readings?page=1&limit=2').set(auth())
    const page2 = await api().get('/readings?page=2&limit=2').set(auth())

    expect(page1.status).toBe(200)
    expect(page1.body).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 })
    expect(page1.body.readings.map((r: { value: number }) => r.value)).toEqual([112, 95])
    expect(page2.body.readings.map((r: { value: number }) => r.value)).toEqual([140])
  })

  it('defaults to page 1 with 20 per page and rejects a bad limit', async () => {
    const res = await api().get('/readings').set(auth())
    const bad = await api().get('/readings?limit=500').set(auth())

    expect(res.body).toMatchObject({ page: 1, limit: 20, total: 0, totalPages: 1, readings: [] })
    expect(bad.status).toBe(400)
  })
})

describe('PUT /readings/:id', () => {
  it('updates a reading, and keeping the same slot is not a duplicate', async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    const res = await api().put('/readings/1').set(auth()).send({ date: DATE, slot: 'AFTER_LUNCH', value: 118 })

    expect(res.status).toBe(200)
    expect(res.body.reading.value).toBe(118)
  })

  it('applies the same validation as creating', async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    await addReading({ date: DATE, slot: 'AFTER_DINNER', value: 150 })

    const toTakenSlot = await api().put('/readings/1').set(auth()).send({ date: DATE, slot: 'AFTER_DINNER', value: 112 })
    const badValue = await api().put('/readings/1').set(auth()).send({ date: DATE, slot: 'AFTER_LUNCH', value: 20 })

    expect(toTakenSlot.body.error).toBe('You already have an After dinner reading for this date.')
    expect(badValue.body.fields.value).toBe('Value must be between 40 and 600 mg/dl.')
  })

  it("can't edit another user's reading", async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')

    const res = await api()
      .put('/readings/1')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ date: DATE, slot: 'AFTER_LUNCH', value: 300 })

    expect(res.status).toBe(404)
  })
})

describe('DELETE /readings/:id', () => {
  it('deletes my reading', async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })

    expect((await api().delete('/readings/1').set(auth())).status).toBe(204)
    expect((await api().get('/readings').set(auth())).body.total).toBe(0)
  })

  it("can't delete another user's reading", async () => {
    await addReading({ date: DATE, slot: 'AFTER_LUNCH', value: 112 })
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')

    const res = await api().delete('/readings/1').set('Authorization', `Bearer ${otherToken}`)
    expect(res.status).toBe(404)
    expect((await api().get('/readings').set(auth())).body.total).toBe(1)
  })
})
