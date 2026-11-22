import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, Hash, Sigma } from 'lucide-react'
import { GlucoseBadge, GlucoseScale } from '@/components/glucose-scale'
import { SendToDoctorCard } from '@/components/send-to-doctor-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/api'
import { formatDate, MESSAGES, readingsApi, todayLocal, type Report, type ReportType } from '@/lib/readings'
import { SLOTS } from '@/lib/slots'
import { usePageTitle } from '@/lib/use-page-title'

const REPORT_TYPES: { type: ReportType; label: string; explains: string }[] = [
  { type: 'daily', label: 'Daily', explains: 'The selected day' },
  { type: 'month-to-date', label: 'Month to date', explains: 'From the 1st of the month to the selected day' },
  { type: 'monthly', label: 'Monthly', explains: 'The whole previous month' },
]

export function ReportsPage() {
  usePageTitle('Reports')
  const [type, setType] = useState<ReportType>('daily')
  const [date, setDate] = useState(todayLocal)
  const [loaded, setLoaded] = useState<{ key: string; report: Report } | null>(null)
  const [error, setError] = useState<{ key: string; message: string } | null>(null)
  const requestKey = `${type}:${date}`

  // Check the date in the browser first; only ask the server when it's valid.
  const dateError = !date ? MESSAGES.dateRequired : date > todayLocal() ? MESSAGES.futureDate : ''

  useEffect(() => {
    if (dateError) return
    let ignore = false
    readingsApi
      .report(type, date)
      .then((report) => !ignore && setLoaded({ key: requestKey, report }))
      .catch((e) => !ignore && setError({ key: requestKey, message: e instanceof ApiError ? e.message : 'Something went wrong.' }))
    return () => {
      ignore = true
    }
  }, [type, date, dateError, requestKey])

  const report = loaded?.key === requestKey ? loaded.report : null
  const message = dateError || (error?.key === requestKey ? error.message : '')
  const current = REPORT_TYPES.find((r) => r.type === type)!

  return (
    <div className="grid gap-8">
      <div className="grid gap-1">
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-lg text-muted-foreground">Pick a date and a report to see your highest, lowest and average readings.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Tabs value={type} onValueChange={(value) => setType(value as ReportType)}>
          <TabsList className="h-11">
            {REPORT_TYPES.map((r) => (
              <TabsTrigger key={r.type} value={r.type} className="px-4 text-base">
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-2">
          <Label htmlFor="report-date" className="font-medium">
            Selected date
          </Label>
          <Input
            id="report-date"
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={dateError ? true : undefined}
            className="h-11 w-52 text-base md:text-base"
          />
        </div>
      </div>

      <Card className="gap-0 pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle className="text-lg">{current.label} report</CardTitle>
          <CardDescription className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" aria-hidden="true" />
            {report ? rangeText(report) : current.explains}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-6">
          {message ? (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          ) : !report ? (
            <div className="h-28 animate-pulse rounded-md bg-muted/60" aria-label="Loading report" />
          ) : report.summary.count === 0 ? (
            <div className="grid gap-1 py-10 text-center">
              <p className="font-medium">No readings for this period</p>
              <p className="text-muted-foreground">Readings you add for {rangeText(report)} will be summarised here.</p>
            </div>
          ) : (
            <div className="grid gap-8">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={ArrowUp} label="Highest" value={report.summary.highest} unit="mg/dl" level={report.summary.highest} />
                <Stat icon={ArrowDown} label="Lowest" value={report.summary.lowest} unit="mg/dl" level={report.summary.lowest} />
                <Stat icon={Sigma} label="Average" value={report.summary.average?.toFixed(1)} unit="mg/dl" level={report.summary.average} />
                <Stat icon={Hash} label="Readings" value={report.summary.count} />
              </div>

              {report.summary.average !== null && (
                <div className="grid gap-3">
                  <h2 className="font-semibold">Your average on the scale</h2>
                  <GlucoseScale value={report.summary.average} markerLabel={`Average ${report.summary.average.toFixed(1)}`} />
                </div>
              )}

              {/* Kenpath: the daily report also lists each reading with its slot */}
              {report.type === 'daily' && (
                <div className="grid gap-2">
                  <h2 className="font-semibold">Readings on {formatDate(report.from)}</h2>
                  <ul className="divide-y rounded-md border">
                    {SLOTS.map((slot) => {
                      const reading = report.readings.find((r) => r.slot === slot.id)
                      const Icon = slot.icon
                      return (
                        <li key={slot.id} className="flex items-center justify-between px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                            {slot.label}
                          </span>
                          {reading ? (
                            <span className="inline-flex items-center gap-3">
                              <GlucoseBadge value={reading.value} className="hidden sm:inline-flex" />
                              <span className="font-semibold">
                                {reading.value} <span className="text-sm font-normal text-muted-foreground">mg/dl</span>
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not logged</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* A new key for each report, so the form's progress message resets when the report changes */}
      {report && (
        <SendToDoctorCard
          key={requestKey}
          type={report.type}
          date={date}
          reportName={`${current.label} report`}
          period={rangeText(report)}
          disabled={report.summary.count === 0}
        />
      )}
    </div>
  )
}

function rangeText(report: Report) {
  return report.from === report.to ? formatDate(report.from) : `${formatDate(report.from)} – ${formatDate(report.to)}`
}

type StatProps = {
  icon: typeof ArrowUp
  label: string
  value: number | string | null | undefined
  unit?: string
  /** A glucose value to show as a coloured level badge under the number. */
  level?: number | null
}

function Stat({ icon: Icon, label, value, unit, level }: StatProps) {
  return (
    <div className="grid content-start gap-2 rounded-md border bg-muted/30 p-4">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      <span className="text-3xl font-semibold tracking-tight">
        {value ?? '–'}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </span>
      {typeof level === 'number' && <GlucoseBadge value={level} className="justify-self-start" />}
    </div>
  )
}
