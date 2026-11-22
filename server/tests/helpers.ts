import request from 'supertest'
import { app } from '../src/app'

export const api = () => request(app)

// Sign up a user and return their token, for tests that need a logged-in user.
export async function signUpAndGetToken(email = 'jane@example.com', name = 'Jane Doe'): Promise<string> {
  const res = await api().post('/auth/signup').send({ name, email, password: 'secret123' })
  return res.body.token
}
