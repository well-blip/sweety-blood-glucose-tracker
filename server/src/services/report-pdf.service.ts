import PDFDocument from 'pdfkit'
import { glucoseLevel, GLUCOSE_LEVELS } from '../utils/glucose-levels'
import { SLOT_LABELS } from '../validation/reading.validation'
import type { Report } from './reports.service'

const REPORT_NAMES = {
  daily: 'Daily report',
  'month-to-date': 'Month-to-date report',
  monthly: 'Monthly report',
} as const

// '2026-10-15' → '15 Oct 2026' (UTC, so the date never shifts)
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function periodText(report: Report): string {
  return report.from === report.to ? formatDate(report.from) : `${formatDate(report.from)} – ${formatDate(report.to)}`
}

export function reportTitle(report: Report): string {
  return REPORT_NAMES[report.type]
}

const INK = '#171717'
const MUTED = '#5e5e5e'
const LINE = '#e5e5e5'

// Builds the report as a PDF (A4) and returns its bytes, ready to attach to an email.
// pdfkit draws onto pages like a canvas: we move a "cursor" (x, y) down the page as we write.
export function buildReportPdf(patientName: string, report: Report, createdOn: string): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Sweety ${reportTitle(report)}` } })
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const width = doc.page.width - left - doc.page.margins.right

  // Heading
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text('Sweety', left, 50)
  doc.font('Helvetica').fontSize(12).fillColor(MUTED).text('Blood glucose report')
  doc.moveDown(1.2)

  // Who, what and when
  const details: [string, string][] = [
    ['Patient', patientName],
    ['Report', reportTitle(report)],
    ['Period', periodText(report)],
    ['Created', formatDate(createdOn)],
  ]
  for (const [label, value] of details) {
    const y = doc.y
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(label, left, y, { width: 80 })
    doc.font('Helvetica-Bold').fillColor(INK).text(value, left + 80, y)
    doc.moveDown(0.3)
  }
  doc.moveDown(1)

  // Summary: four boxes in a row
  const { summary } = report
  const boxes: [string, string, number | null][] = [
    ['Highest', summary.highest !== null ? `${summary.highest} mg/dl` : '–', summary.highest],
    ['Lowest', summary.lowest !== null ? `${summary.lowest} mg/dl` : '–', summary.lowest],
    ['Average', summary.average !== null ? `${summary.average.toFixed(1)} mg/dl` : '–', summary.average],
    ['Readings', String(summary.count), null],
  ]
  const gap = 10
  const boxWidth = (width - gap * 3) / 4
  const boxTop = doc.y
  boxes.forEach(([label, value, level], i) => {
    const x = left + i * (boxWidth + gap)
    doc.roundedRect(x, boxTop, boxWidth, 62, 4).lineWidth(0.8).strokeColor(LINE).stroke()
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, x + 10, boxTop + 10, { width: boxWidth - 20 })
    doc.font('Helvetica-Bold').fontSize(13).fillColor(INK).text(value, x + 10, boxTop + 24, { width: boxWidth - 20 })
    if (level !== null) {
      const band = glucoseLevel(level)
      doc.circle(x + 13, boxTop + 49, 3).fill(band.color)
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(band.label, x + 20, boxTop + 45)
    }
  })
  doc.x = left
  doc.y = boxTop + 62 + 24

  // Every reading in the period
  doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text('Readings', left)
  doc.moveDown(0.5)

  if (report.readings.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor(MUTED).text('No readings were recorded in this period.')
  } else {
    const columns = [
      { title: 'Date', x: left, width: 120 },
      { title: 'Time slot', x: left + 120, width: 150 },
      { title: 'Value', x: left + 270, width: 90 },
      { title: 'Level', x: left + 360, width: width - 360 },
    ]
    const rowHeight = 20
    const bottom = doc.page.height - doc.page.margins.bottom - 40

    const drawHeader = () => {
      const y = doc.y
      doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
      columns.forEach((c) => doc.text(c.title.toUpperCase(), c.x + 6, y, { width: c.width - 6 }))
      doc.moveTo(left, y + 14).lineTo(left + width, y + 14).lineWidth(0.8).strokeColor(LINE).stroke()
      doc.y = y + 18
    }
    drawHeader()

    report.readings.forEach((reading, i) => {
      // Start a new page (with the column titles again) when this one is full
      if (doc.y + rowHeight > bottom) {
        doc.addPage()
        drawHeader()
      }
      const y = doc.y
      if (i % 2 === 1) doc.rect(left, y - 4, width, rowHeight).fill('#fafafa')
      const band = glucoseLevel(reading.value)
      doc.font('Helvetica').fontSize(10).fillColor(INK)
      doc.text(formatDate(reading.date), columns[0].x + 6, y, { width: columns[0].width - 6 })
      doc.text(SLOT_LABELS[reading.slot], columns[1].x + 6, y, { width: columns[1].width - 6 })
      doc.font('Helvetica-Bold').text(`${reading.value} mg/dl`, columns[2].x + 6, y, { width: columns[2].width - 6 })
      doc.circle(columns[3].x + 10, y + 4, 3).fill(band.color)
      doc.font('Helvetica').fillColor(INK).text(band.label, columns[3].x + 18, y, { width: columns[3].width - 18 })
      doc.y = y + rowHeight
    })
  }

  // Key and a short note, under the table
  doc.moveDown(1.5)
  doc.x = left
  doc.font('Helvetica').fontSize(8).fillColor(MUTED)
  doc.text(`Levels: ${GLUCOSE_LEVELS.map((l) => `${l.label} ${l.range}`).join('  ·  ')} (mg/dl).`, { width })
  doc.text('Recorded by the patient in Sweety. For information; please interpret alongside clinical judgement.', {
    width,
  })

  doc.end()
  return done
}
