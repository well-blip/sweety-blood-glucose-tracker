import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool'
import { AppError } from '../errors'
import type { LogInInput, SignUpInput } from '../validation/auth.validation'

// Cost factor: bcrypt runs 2^10 rounds of hashing. Higher = slower to crack, but slower logins too.
const SALT_ROUNDS = 10
const TOKEN_LIFETIME = '7d'

// Used when the email doesn't exist, so a failed login takes the same time either way
// (otherwise an attacker could tell which emails are registered by timing the response).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS)

export type PublicUser = { id: number; name: string; email: string }

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set. Copy .env.example to .env.')
  return secret
}

export function createToken(userId: number): string {
  // `sub` (subject) is the standard JWT field for "who this token is about".
  return jwt.sign({ sub: String(userId) }, jwtSecret(), { expiresIn: TOKEN_LIFETIME })
}

// Returns the user id inside a valid token, or null if the token is missing, forged or expired.
export function verifyToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, jwtSecret())
    const userId = Number(typeof payload === 'object' ? payload.sub : NaN)
    return Number.isInteger(userId) ? userId : null
  } catch {
    return null
  }
}

export async function signUp(input: SignUpInput): Promise<{ user: PublicUser; token: string }> {
  // bcrypt generates a random salt and stores it inside the hash string itself.
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  try {
    const result = await pool.query<PublicUser>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [input.name, input.email, passwordHash],
    )
    const user = result.rows[0]
    return { user, token: createToken(user.id) }
  } catch (error) {
    // 23505 = unique_violation: the email is already registered (the UNIQUE constraint caught it)
    if ((error as { code?: string }).code === '23505') {
      throw new AppError(409, 'An account with this email already exists.', {
        email: 'An account with this email already exists.',
      })
    }
    throw error
  }
}

export async function logIn(input: LogInInput): Promise<{ user: PublicUser; token: string }> {
  const result = await pool.query<PublicUser & { password_hash: string }>(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [input.email],
  )
  const row = result.rows[0]

  // bcrypt.compare re-hashes the typed password with the salt stored in the hash and compares.
  const passwordMatches = await bcrypt.compare(input.password, row?.password_hash ?? DUMMY_HASH)

  // Same message for "no such email" and "wrong password", so we don't reveal which emails exist.
  if (!row || !passwordMatches) {
    throw new AppError(401, 'Email or password is incorrect.')
  }

  const user = { id: row.id, name: row.name, email: row.email }
  return { user, token: createToken(user.id) }
}

export async function getUserById(userId: number): Promise<PublicUser | null> {
  const result = await pool.query<PublicUser>('SELECT id, name, email FROM users WHERE id = $1', [userId])
  return result.rows[0] ?? null
}
