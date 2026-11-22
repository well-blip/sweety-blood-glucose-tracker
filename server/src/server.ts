import 'dotenv/config'
import { app } from './app'

const port = Number(process.env.PORT ?? 4000)

// Express 5 passes a startup error (like a busy port) to this callback instead of crashing.
app.listen(port, (error?: Error) => {
  if (error) {
    const busy = (error as NodeJS.ErrnoException).code === 'EADDRINUSE'
    console.error(
      busy
        ? `✖ Port ${port} is already in use by another program. Stop it, or set a different PORT in server/.env\n  (and the same port in VITE_API_URL in clientSide/.env).`
        : `✖ The API could not start: ${error.message}`,
    )
    process.exit(1)
  }
  console.log(`API listening on http://localhost:${port}`)
})
