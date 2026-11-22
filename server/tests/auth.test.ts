import { describe, expect, it } from 'vitest'
import { pool } from '../src/db/pool'
import { api, signUpAndGetToken } from './helpers'

const jane = { name: 'Jane Doe', email: 'jane@example.com', password: 'secret123' }

describe('POST /auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const res = await api().post('/auth/signup').send(jane)

    expect(res.status).toBe(201)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user).toEqual({ id: 1, name: 'Jane Doe', email: 'jane@example.com' })
  })

  it('stores a bcrypt hash, never the plain password', async () => {
    await api().post('/auth/signup').send(jane)
    const { rows } = await pool.query('SELECT password_hash FROM users')

    expect(rows[0].password_hash).not.toBe(jane.password)
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$10\$/) // bcrypt format, cost 10
  })

  it('treats emails case-insensitively', async () => {
    await api().post('/auth/signup').send(jane)
    const res = await api().post('/auth/signup').send({ ...jane, email: '  JANE@Example.com ' })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('An account with this email already exists.')
  })

  it('returns a message for each invalid field', async () => {
    const res = await api().post('/auth/signup').send({ name: ' ', email: 'not-an-email', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.fields).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      password: 'Password must be at least 8 characters.',
    })
  })
})

describe('POST /auth/login', () => {
  it('logs in with the right password', async () => {
    await api().post('/auth/signup').send(jane)
    const res = await api().post('/auth/login').send({ email: 'Jane@example.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toEqual(expect.any(String))
    expect(res.body.user.email).toBe('jane@example.com')
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    await api().post('/auth/signup').send(jane)
    const wrongPassword = await api().post('/auth/login').send({ email: jane.email, password: 'wrong-pass' })
    const unknownEmail = await api().post('/auth/login').send({ email: 'nobody@example.com', password: 'secret123' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.error).toBe('Email or password is incorrect.')
    expect(unknownEmail.body.error).toBe('Email or password is incorrect.')
  })
})

describe('GET /auth/me', () => {
  it('returns the logged-in user for a valid token', async () => {
    const token = await signUpAndGetToken()
    const res = await api().get('/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Jane Doe')
  })

  it('rejects a missing or fake token', async () => {
    const missing = await api().get('/auth/me')
    const fake = await api().get('/auth/me').set('Authorization', 'Bearer not.a.real.token')

    expect(missing.status).toBe(401)
    expect(fake.status).toBe(401)
    expect(missing.body.error).toBe('Please log in to continue.')
  })
})
