import nodemailer, { type Transporter } from 'nodemailer'

// In development this points at Mailpit (docker-compose), a fake mail server that keeps every email
// in a local inbox at http://localhost:8025 instead of delivering it. In production you would set
// SMTP_HOST/SMTP_PORT (and a username/password) for a real provider; the code stays the same.
let transport: Transporter | null = null

export function mailTransport(): Transporter {
  if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST is not set. Copy .env.example to .env.')
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  })
  return transport
}

export const mailFrom = () => process.env.MAIL_FROM ?? 'Sweety <reports@sweety.local>'
