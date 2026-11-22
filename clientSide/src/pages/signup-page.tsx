import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router'
import { AuthLayout } from '@/components/auth-layout'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export function SignupPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setFormError('')
    setSubmitting(true)
    try {
      await signUp(name, email, password)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields)
        if (Object.keys(error.fields).length === 0) setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Keep track of your blood sugar in one calm place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
            Log in
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
          id="name"
          label="Your name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters."
        />
        <Button type="submit" disabled={submitting} className="mt-1 h-11 w-full rounded-lg text-base">
          {submitting ? 'Creating account…' : 'Continue'}
          {!submitting && <ArrowRight aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  )
}
