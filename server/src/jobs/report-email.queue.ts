import { Queue } from 'bullmq'
import { redisUrl } from '../cache/redis'
import { AppError } from '../errors'
import type { ReportType } from '../utils/dates'

// The queue lives in Redis. The API only ADDS jobs to it (fast), and a separate worker process
// (src/worker.ts) picks them up and does the slow part: building the PDF and sending the email.
// So the user gets an instant answer, and a slow or failing mail server never blocks the API.
export const REPORT_EMAIL_QUEUE = 'report-email'

export type ReportEmailJob = {
  userId: number
  type: ReportType
  date: string
  doctorEmail: string
}

export type ReportEmailResult = { sentTo: string; messageId: string }

// BullMQ needs maxRetriesPerRequest: null on its connections (it handles retries itself).
export function queueConnection() {
  if (!redisUrl) throw new AppError(503, "Emailing reports isn't set up on this server.")
  return { url: redisUrl, maxRetriesPerRequest: null }
}

let queue: Queue<ReportEmailJob, ReportEmailResult> | null = null

function reportEmailQueue() {
  queue ??= new Queue<ReportEmailJob, ReportEmailResult>(REPORT_EMAIL_QUEUE, {
    connection: queueConnection(),
    defaultJobOptions: {
      attempts: 3, // if sending fails (mail server down), try again…
      backoff: { type: 'exponential', delay: 5_000 }, // …after 5 s, then 10 s
      removeOnComplete: { age: 24 * 60 * 60 }, // keep finished jobs for a day so status can be checked
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  })
  return queue
}

// Gives up after a few seconds if Redis can't be reached, instead of leaving the request hanging.
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AppError(503, "Couldn't send the report right now. Please try again.")), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer)
  }
}

export async function enqueueReportEmail(data: ReportEmailJob): Promise<string> {
  const job = await withTimeout(reportEmailQueue().add('send-report', data), 5_000)
  return job.id!
}

export type ReportEmailStatus =
  | { status: 'queued' | 'sending'; sentTo: string }
  | { status: 'sent'; sentTo: string }
  | { status: 'failed'; sentTo: string; error: string }

// Plain-language status for the client. Only the user who asked for the email can see it.
export async function getReportEmailStatus(jobId: string, userId: number): Promise<ReportEmailStatus> {
  const job = await withTimeout(reportEmailQueue().getJob(jobId), 5_000)
  if (!job || job.data.userId !== userId) throw new AppError(404, 'Email request not found.')

  const sentTo = job.data.doctorEmail
  const state = await job.getState()
  if (state === 'completed') return { status: 'sent', sentTo }
  if (state === 'failed') return { status: 'failed', sentTo, error: "The email couldn't be sent. Please try again." }
  if (state === 'active') return { status: 'sending', sentTo }
  return { status: 'queued', sentTo } // waiting, or delayed before a retry
}

export async function closeReportEmailQueue() {
  await queue?.close()
  queue = null
}
