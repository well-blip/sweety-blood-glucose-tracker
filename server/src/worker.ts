// The background worker: a separate process from the API.  Run it with  npm run worker
// It waits for "email this report to my doctor" jobs in Redis and processes them one by one.
import 'dotenv/config'
import { Worker } from 'bullmq'
import { pool } from './db/pool'
import { sendReportEmail } from './jobs/report-email.job'
import { queueConnection, REPORT_EMAIL_QUEUE, type ReportEmailJob, type ReportEmailResult } from './jobs/report-email.queue'

const worker = new Worker<ReportEmailJob, ReportEmailResult>(REPORT_EMAIL_QUEUE, (job) => sendReportEmail(job.data), {
  connection: queueConnection(),
  concurrency: 2, // at most two PDFs being built at once
})

// Log job ids and outcomes only; no email addresses or health data in the logs.
worker.on('ready', () => console.log('Worker ready: waiting for report emails'))
worker.on('completed', (job) => console.log(`✔ Report email job ${job.id} sent`))
worker.on('failed', (job, error) =>
  console.warn(`✖ Report email job ${job?.id} failed (attempt ${job?.attemptsMade}): ${error.message}`),
)

// Finish the current job before exiting (Ctrl+C, or a deploy stopping the process)
async function shutdown() {
  await worker.close()
  await pool.end()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
