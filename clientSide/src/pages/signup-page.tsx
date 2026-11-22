import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router'
import { AuthCard } from '@/components/auth-card'
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
    <AuthCard
      title="Create your Sweety account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-destructive">
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
        />
        {!errors.password && <p className="-mt-3 text-muted-foreground">At least 8 characters.</p>}
        <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl text-lg">
          {submitting ? 'Creating account…' : 'Continue'}
          {!submitting && <ArrowRight className="size-5" aria-hidden="true" />}
        </Button>
      </form>
    </AuthCard>
  )
}
