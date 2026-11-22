import type { ZodError } from 'zod'

// An error we throw on purpose, with the HTTP status and the message the user should see.
// `fields` maps form field names to messages, so the client can show each error under its input.
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
  }
}

// Turn a Zod validation failure into a 400 AppError with one message per field.
export function validationError(error: ZodError): AppError {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    // Keep only the first problem for each field; one clear message is easier to act on.
    if (!fields[field]) fields[field] = issue.message
  }
  const firstMessage = Object.values(fields)[0] ?? 'Please check the form.'
  return new AppError(400, firstMessage, fields)
}
