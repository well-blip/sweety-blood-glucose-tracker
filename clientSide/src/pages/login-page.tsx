import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth-layout'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { usePageTitle } from '@/lib/use-page-title'

export function LoginPage() {
  usePageTitle('Log in')
  const { user, logIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Where to go after logging in: the page they tried to open, or the readings page
  const goTo = (location.state as { from?: string } | null)?.from ?? '/'

  if (user) return <Navigate to={goTo} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setSubmitting(true)
    try {
      await logIn(email, password)
      navigate(goTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields)
        // "Email or password is incorrect." has no single field, so it goes at the top
        if (Object.keys(error.fields).length === 0) setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your readings and reports."
      footer={
        <>
          New to Sweety?{' '}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-5">
        {formError && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </p>
        )}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full rounded-lg text-base">
          {submitting ? 'Logging in…' : 'Continue'}
          {!submitting && <ArrowRight aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
