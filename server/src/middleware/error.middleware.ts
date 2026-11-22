import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../errors'

// Any request that didn't match a route ends up here.
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
}

// Express calls this whenever a route throws (Express 5 also catches errors from async routes).
// Every error response has the same shape: { error: string, fields?: { [field]: string } }
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, fields: err.fields })
    return
  }

  // express.json() throws this when the request body isn't valid JSON
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'The request body is not valid JSON.' })
    return
  }

  // Anything else is a bug: log it for us, but never send internal details to the user.
  console.error(err)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}
