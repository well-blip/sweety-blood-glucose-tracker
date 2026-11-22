import { useState, type ComponentProps } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FormFieldProps = ComponentProps<typeof Input> & {
  id: string
  label: string
  error?: string
  hint?: string
}

// A label, a large input, and either a hint or the error message under it.
// aria-invalid + aria-describedby let screen readers announce the error with the field.
export function FormField({ id, label, error, hint, type, ...inputProps }: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const messageId = `${id}-message`

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className="h-11 rounded-lg bg-background px-3.5 text-base shadow-xs md:text-base"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={messageId} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
