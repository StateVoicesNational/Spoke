import { log } from '../lib'
import mailgunFactory from 'mailgun-js'
const mailgun = mailgunFactory({
  apiKey: process.env.MAILGUN_SECRET_KEY,
  domain: process.env.MAILGUN_DOMAIN
})

export const sendEmail = async ({ to, subject, text, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`)
  if (process.env.NODE_ENV === 'development') {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`)
    return null
  } else {
    const params = {
      from: process.env.MAILGUN_FROM_EMAIL,
      to,
      subject,
      text
    }

    if (replyTo) {
      params['h:Reply-To'] = replyTo
    }

    return mailgun.messages().send(params)
  }
}
