export default function parseBaseURL() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL
  } else if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`
  }
  return ''
}
