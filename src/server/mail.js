import { log } from '../lib'
import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_HOST_PORT,
  secure: typeof process.env.EMAIL_HOST_SECURE !== 'undefined' ? process.env.EMAIL_HOST_SECURE : true,
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD
  }
})

export const sendEmail = async ({ to, subject, text, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`)
  if (process.env.NODE_ENV === 'development') {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`)
    return null
  }
  const params = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text
  }

  if (replyTo) {
    params['replyTo'] = replyTo
  }
  return transporter.sendMail(params)
}
