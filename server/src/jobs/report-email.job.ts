import { UnrecoverableError } from 'bullmq'
import type { Transporter } from 'nodemailer'
import { getUserById } from '../services/auth.service'
import { mailFrom, mailTransport } from '../services/mailer.service'
import { buildReportPdf, periodText, reportTitle } from '../services/report-pdf.service'
import { getReport } from '../services/reports.service'
import { todayInAppTimezone } from '../utils/dates'
import type { ReportEmailJob, ReportEmailResult } from './report-email.queue'

// What the worker does for each job: load the report, turn it into a PDF, email it to the doctor.
// `transport` can be swapped in tests so nothing is actually sent.
export async function sendReportEmail(
  data: ReportEmailJob,
  transport: Transporter = mailTransport(),
): Promise<ReportEmailResult> {
  const user = await getUserById(data.userId)
  // Retrying won't bring a deleted account back, so tell BullMQ not to try again.
  if (!user) throw new UnrecoverableError('The patient account no longer exists.')

  const report = await getReport(user.id, data.type, data.date)
  const pdf = await buildReportPdf(user.name, report, todayInAppTimezone())
  const period = periodText(report)
  const { summary } = report

  const lines =
    summary.count === 0
      ? ['No readings were recorded in this period.']
      : [
          `Readings: ${summary.count}`,
          `Average: ${summary.average!.toFixed(1)} mg/dl`,
          `Highest: ${summary.highest} mg/dl`,
          `Lowest: ${summary.lowest} mg/dl`,
        ]

  const info = await transport.sendMail({
    from: mailFrom(),
    to: data.doctorEmail,
    subject: `${reportTitle(report)} for ${user.name}: ${period}`,
    text: [
      'Hello Doctor,',
      '',
      `${user.name} has shared their blood glucose ${reportTitle(report).toLowerCase()} for ${period} from Sweety.`,
      '',
      ...lines,
      '',
      'The full report, with every reading, is attached as a PDF.',
      '',
      'Sent by Sweety – Blood Glucose Tracker',
    ].join('\n'),
    attachments: [
      {
        filename: `sweety-${data.type}-report-${report.from}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  })

  return { sentTo: data.doctorEmail, messageId: info.messageId }
}
