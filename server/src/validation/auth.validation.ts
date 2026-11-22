import { z } from 'zod'

// Emails are trimmed and lower-cased, so "Jane@Example.com " and "jane@example.com" are one account.
const email = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address.')
  .pipe(z.email('Enter a valid email address.'))

export const signUpSchema = z.object({
  name: z
    .string({ error: 'Enter your name.' })
    .trim()
    .min(1, 'Enter your name.')
    .max(100, 'Name must be 100 characters or fewer.'),
  email,
  password: z
    .string({ error: 'Enter a password.' })
    .min(8, 'Password must be at least 8 characters.')
    // bcrypt only uses the first 72 bytes of a password, so longer ones are rejected
    .max(72, 'Password must be 72 characters or fewer.'),
})

export const logInSchema = z.object({
  email,
  password: z.string({ error: 'Enter your password.' }).min(1, 'Enter your password.'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type LogInInput = z.infer<typeof logInSchema>
