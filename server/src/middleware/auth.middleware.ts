import type { RequestHandler } from 'express'
import { AppError } from '../errors'
import { verifyToken } from '../services/auth.service'

// Put this in front of any route that needs a logged-in user.
// It reads "Authorization: Bearer <token>", checks the token's signature and expiry,
// and stores the user id on the request. Routes then use req.userId, never an id sent by the client.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')

  const userId = scheme === 'Bearer' && token ? verifyToken(token) : null
  if (userId === null) {
    throw new AppError(401, 'Please log in to continue.')
  }

  req.userId = userId
  next()
}
