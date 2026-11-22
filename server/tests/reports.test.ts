import { beforeEach, describe, expect, it } from 'vitest'
import { reportRange } from '../src/utils/dates'
import { api, signUpAndGetToken } from './helpers'

describe('reportRange', () => {
  it('daily covers only the selected date', () => {
    expect(reportRange('daily', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' })
  })

  it('month-to-date runs from the 1st to the selected date', () => {
    expect(reportRange('month-to-date', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' })
    expect(reportRange('month-to-date', '2026-10-01')).toEqual({ from: '2026-10-01', to: '2026-10-01' })
  })

  it('monthly is the whole previous month (Kenpath example: 15 Oct → 1–30 Sep)', () => {
    expect(reportRange('monthly', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('monthly handles 31-day months, February and leap years', () => {
    expect(reportRange('monthly', '2026-11-30')).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(reportRange('monthly', '2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(reportRange('monthly', '2028-03-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
  })

  it('monthly in January goes back to December of the previous year', () => {
    expect(reportRange('monthly', '2027-01-15')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })
})

describe('GET /reports', () => {
  let token: string
  const add = (date: string, slot: string, value: number, t = token) =>
    api().post('/readings').set('Authorization', `Bearer ${t}`).send({ date, slot, value })
  const report = (query: string, t = token) => api().get(`/reports?${query}`).set('Authorization', `Bearer ${t}`)

  beforeEach(async () => {
    token = await signUpAndGetToken()
    // 30 Sep (previous month), plus three readings on 15 Oct and one on 1 Oct
    await add('2026-09-30', 'AFTER_DINNER', 200)
    await add('2026-10-01', 'MORNING_FASTING', 80)
    await add('2026-10-15', 'MORNING_FASTING', 95)
    await add('2026-10-15', 'AFTER_BREAKFAST', 138)
    await add('2026-10-15', 'AFTER_LUNCH', 112)
  })

  it('daily: summary for the date plus each reading with its slot', async () => {
    const res = await report('type=daily&date=2026-10-15')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ type: 'daily', from: '2026-10-15', to: '2026-10-15' })
    // (95 + 138 + 112) / 3 = 115
    expect(res.body.summary).toEqual({ highest: 138, lowest: 95, average: 115, count: 3 })
    expect(res.body.readings.map((r: { slot: string }) => r.slot)).toEqual([
      'MORNING_FASTING',
      'AFTER_BREAKFAST',
      'AFTER_LUNCH',
    ])
  })

  it('month-to-date: 1st of the month to the selected date', async () => {
    const res = await report('type=month-to-date&date=2026-10-15')

    expect(res.body).toMatchObject({ from: '2026-10-01', to: '2026-10-15' })
    // (80 + 95 + 138 + 112) / 4 = 106.25 → 106.3
    expect(res.body.summary).toEqual({ highest: 138, lowest: 80, average: 106.3, count: 4 })
  })

  it('monthly: the whole previous month only', async () => {
    const res = await report('type=monthly&date=2026-10-15')

    expect(res.body).toMatchObject({ from: '2026-09-01', to: '2026-09-30' })
    expect(res.body.summary).toEqual({ highest: 200, lowest: 200, average: 200, count: 1 })
  })

  it('rounds the average to 1 decimal place', async () => {
    await add('2026-10-14', 'MORNING_FASTING', 100)
    await add('2026-10-14', 'AFTER_BREAKFAST', 101)
    await add('2026-10-14', 'AFTER_LUNCH', 101)

    const res = await report('type=daily&date=2026-10-14')
    expect(res.body.summary.average).toBe(100.7) // 100.666…
  })

  it('returns an empty summary when there are no readings', async () => {
    const res = await report('type=daily&date=2026-10-10')

    expect(res.status).toBe(200)
    expect(res.body.summary).toEqual({ highest: null, lowest: null, average: null, count: 0 })
    expect(res.body.readings).toEqual([])
  })

  it("never includes another user's readings", async () => {
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')
    await add('2026-10-15', 'AFTER_DINNER', 500, otherToken)

    const mine = await report('type=daily&date=2026-10-15')
    const theirs = await report('type=daily&date=2026-10-15', otherToken)

    expect(mine.body.summary.highest).toBe(138)
    expect(theirs.body.summary).toEqual({ highest: 500, lowest: 500, average: 500, count: 1 })
  })

  it('validates the query', async () => {
    const badType = await report('type=weekly&date=2026-10-15')
    const badDate = await report('type=daily&date=2026-13-01')
    const noAuth = await api().get('/reports?type=daily&date=2026-10-15')

    expect(badType.status).toBe(400)
    expect(badDate.body.fields.date).toBe('Choose a valid date.')
    expect(noAuth.status).toBe(401)
  })
})
