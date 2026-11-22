import { Router } from 'express'
import { AppError, validationError } from '../errors'
import { requireAuth } from '../middleware/auth.middleware'
import { getUserById, logIn, signUp } from '../services/auth.service'
import { logInSchema, signUpSchema } from '../validation/auth.validation'

export const authRouter = Router()

// POST /auth/signup  { name, email, password } → 201 { user, token }
authRouter.post('/signup', async (req, res) => {
  const parsed = signUpSchema.safeParse(req.body ?? {})
  if (!parsed.success) throw validationError(parsed.error)

  const result = await signUp(parsed.data)
  res.status(201).json(result)
})

// POST /auth/login  { email, password } → 200 { user, token }
authRouter.post('/login', async (req, res) => {
  const parsed = logInSchema.safeParse(req.body ?? {})
  if (!parsed.success) throw validationError(parsed.error)

  const result = await logIn(parsed.data)
  res.json(result)
})

// GET /auth/me → 200 { user }   (lets the client check a saved token on page load)
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await getUserById(req.userId!)
  if (!user) throw new AppError(401, 'Please log in to continue.')
  res.json({ user })
})
