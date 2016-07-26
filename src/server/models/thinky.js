import thinky from 'thinky'

export default thinky({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME,
  authKey: process.env.DB_KEY
})
