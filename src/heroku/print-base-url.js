if (process.env.BASE_URL) {
  console.log(process.env.BASE_URL)
} else if (process.env.HEROKU_APP_NAME) {
  console.log(`https://${process.env.HEROKU_APP_NAME}.herokuapp.com`)
} else {
  throw new Error('Neither BASE_URL nor HEROKU_APP_NAME environment variables are present.')
}
