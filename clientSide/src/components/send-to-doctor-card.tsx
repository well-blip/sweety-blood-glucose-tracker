import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CircleCheck, LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { readingsApi, type ReportType } from '@/lib/readings'
import { cn } from '@/lib/utils'

const DOCTOR_EMAIL_KEY = 'sweety.doctorEmail'

type SendToDoctorCardProps = {
  type: ReportType
  date: string
  reportName: string // "Monthly report"
  period: string // "1 Oct 2026 – 31 Oct 2026"
  disabled: boolean // nothing to send when the report is empty
}

type Progress =
  | { state: 'idle' }
  | { state: 'working'; message: string }
  | { state: 'sent'; message: string }
  | { state: 'failed'; message: string }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// "Send to my doctor": the server queues a background job (BullMQ) that turns this report into a
// PDF and emails it. We get a job id back at once, then check its status every second until it's done.
export function SendToDoctorCard({ type, date, reportName, period, disabled }: SendToDoctorCardProps) {
  // Remember the doctor's address in this browser, so it's filled in next time.
  const [doctorEmail, setDoctorEmail] = useState(() => {
    try {
      return localStorage.getItem(DOCTOR_EMAIL_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [fieldError, setFieldError] = useState('')
  const [progress, setProgress] = useState<Progress>({ state: 'idle' })

  // Stop checking the status if the user leaves the page or picks another report
  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldError('')
    if (!doctorEmail.trim()) {
      setFieldError("Enter your doctor's email address.")
      return
    }

    setProgress({ state: 'working', message: 'Preparing the PDF…' })
    try {
      const { jobId } = await readingsApi.emailReport(type, date, doctorEmail)
      try {
        localStorage.setItem(DOCTOR_EMAIL_KEY, doctorEmail.trim())
      } catch {
        // storage blocked (private window): just don't remember it
      }

      for (let attempt = 0; attempt < 30; attempt++) {
        await wait(1000)
        if (!isMounted.current) return
        const job = await readingsApi.emailStatus(jobId)
        if (job.status === 'sent') {
          setProgress({ state: 'sent', message: `Sent to ${job.sentTo}.` })
          return
        }
        if (job.status === 'failed') {
          setProgress({ state: 'failed', message: job.error ?? "The email couldn't be sent. Please try again." })
          return
        }
        if (job.status === 'sending') setProgress({ state: 'working', message: 'Sending the email…' })
      }
      setProgress({ state: 'working', message: 'This is taking longer than usual. It will be sent shortly.' })
    } catch (error) {
      if (error instanceof ApiError && error.fields.doctorEmail) {
        setFieldError(error.fields.doctorEmail)
        setProgress({ state: 'idle' })
      } else {
        setProgress({ state: 'failed', message: error instanceof ApiError ? error.message : 'Something went wrong.' })
      }
    }
  }

  const working = progress.state === 'working'

  return (
    <Card className="gap-0 pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-lg">Send this report to your doctor</CardTitle>
        <CardDescription className="text-base">
          {disabled
            ? 'Add some readings for this period first, then you can send the report.'
            : `We'll email your ${reportName.toLowerCase()} (${period}) as a PDF.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <div className="grid items-start gap-4 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <Label htmlFor="doctor-email" className="font-medium">
                Doctor's email
              </Label>
              <Input
                id="doctor-email"
                type="email"
                autoComplete="off"
                placeholder="name@clinic.com"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                disabled={disabled || working}
                aria-invalid={fieldError ? true : undefined}
                className="h-11 text-base md:text-base"
              />
              {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
            </div>
            <Button type="submit" disabled={disabled || working} className="h-11 px-5 text-base sm:mt-[1.85rem]">
              {working ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              Email PDF
            </Button>
          </div>

          {progress.state !== 'idle' && (
            <p
              role="status"
              className={cn(
                'flex items-center gap-2',
                progress.state === 'sent' && 'text-emerald-700',
                progress.state === 'failed' && 'text-destructive',
                progress.state === 'working' && 'text-muted-foreground',
              )}
            >
              {progress.state === 'sent' && <CircleCheck className="size-5" aria-hidden="true" />}
              {progress.message}
            </p>
          )}

          {import.meta.env.DEV && (
            <p className="text-sm text-muted-foreground">
              Demo setup: emails go to a local test inbox (Mailpit) at{' '}
              <a href="http://localhost:8025" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                localhost:8025
              </a>
              , not to a real mailbox.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
