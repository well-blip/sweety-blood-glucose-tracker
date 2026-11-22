import express from 'express'
import cors from 'cors'
import { errorHandler, notFoundHandler } from './middleware/error.middleware'
import { authRouter } from './routes/auth.routes'
import { healthRouter } from './routes/health.routes'
import { readingsRouter } from './routes/readings.routes'

export const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

app.use('/health', healthRouter)
app.use('/auth', authRouter)
app.use('/readings', readingsRouter)

// These two must come last: unknown URLs, then errors from any route above
app.use(notFoundHandler)
app.use(errorHandler)
