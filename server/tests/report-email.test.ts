import nodemailer from 'nodemailer'
import { beforeEach, describe, expect, it } from 'vitest'
import { sendReportEmail } from '../src/jobs/report-email.job'
import { buildReportPdf } from '../src/services/report-pdf.service'
import { getReport } from '../src/services/reports.service'
import { todayInAppTimezone } from '../src/utils/dates'
import { api, signUpAndGetToken } from './helpers'

const today = todayInAppTimezone()
const DOCTOR = 'dr.rao@example.com' // example.com is reserved for examples: never a real inbox

describe('POST /reports/email', () => {
  let token: string
  beforeEach(async () => {
    token = await signUpAndGetToken()
  })

  it('queues the email and answers 202 straight away', async () => {
    const res = await api()
      .post('/reports/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'monthly', date: today, doctorEmail: DOCTOR })
    expect(res.status).toBe(202)
    expect(res.body).toEqual({ jobId: expect.any(String), status: 'queued' })

    // No worker runs during tests, so the job is still waiting in the queue
    const status = await api().get(`/reports/email/${res.body.jobId}`).set('Authorization', `Bearer ${token}`)
    expect(status.body).toEqual({ status: 'queued', sentTo: DOCTOR })
  })

  it("rejects a missing or invalid doctor's email", async () => {
    const missing = await api()
      .post('/reports/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'daily', date: today })
    expect(missing.status).toBe(400)
    expect(missing.body.fields.doctorEmail).toBe("Enter your doctor's email address.")

    const invalid = await api()
      .post('/reports/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'daily', date: today, doctorEmail: 'not-an-email' })
    expect(invalid.body.fields.doctorEmail).toBe('Enter a valid email address.')
  })

  it("doesn't let one user see another user's email request", async () => {
    const res = await api()
      .post('/reports/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'daily', date: today, doctorEmail: DOCTOR })
    const otherToken = await signUpAndGetToken('sam@example.com', 'Sam')
    const peek = await api().get(`/reports/email/${res.body.jobId}`).set('Authorization', `Bearer ${otherToken}`)
    expect(peek.status).toBe(404)
  })
})

describe('report email job (what the worker runs)', () => {
  it('builds a PDF of the report', async () => {
    const report = await getReport(1, 'daily', today) // empty report is fine
    const pdf = await buildReportPdf('Jane Doe', report, today)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('emails the PDF to the doctor', async () => {
    const token = await signUpAndGetToken()
    await api()
      .post('/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: today, slot: 'MORNING_FASTING', value: 104 })

    // A "stream" transport builds the whole email in memory instead of sending it anywhere
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true })
    let raw = ''
    const sendMail = transport.sendMail.bind(transport)
    transport.sendMail = (async (mail: Parameters<typeof sendMail>[0]) => {
      const info = await sendMail(mail)
      raw = (info.message as Buffer).toString()
      return info
    }) as typeof transport.sendMail

    const result = await sendReportEmail({ userId: 1, type: 'daily', date: today, doctorEmail: DOCTOR }, transport)

    expect(result.sentTo).toBe(DOCTOR)
    expect(raw).toContain(`To: ${DOCTOR}`)
    expect(raw).toContain('Subject: Daily report for Jane Doe')
    expect(raw).toContain('Average: 104.0 mg/dl')
    expect(raw).toContain('Content-Type: application/pdf')
  })
})
