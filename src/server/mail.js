import { log } from '../lib'
import nodemailer from 'nodemailer'
import mailgunConstructor from 'mailgun-js'

const mailgun =
  process.env.MAILGUN_API_KEY &&
  process.env.MAILGUN_DOMAIN &&
  mailgunConstructor({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN })

const sender =
  process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN
    ? {
      sendMail: ({ from, to, subject, replyTo, text, html }) =>
            mailgun.messages().send(
              {
                from,
                'h:Reply-To': replyTo,
                to,
                subject,
                text,
                html
              })
    }
    : nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_HOST_PORT,
      secure:
          typeof process.env.EMAIL_HOST_SECURE !== 'undefined'
            ? process.env.EMAIL_HOST_SECURE
            : true,
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD
      }
    })

export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`)

  if (process.env.NODE_ENV === 'development') {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`)
    return null
  }

  const params = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  }

  if (replyTo) {
    params['replyTo'] = replyTo
  }

  return sender.sendMail(params)
}
