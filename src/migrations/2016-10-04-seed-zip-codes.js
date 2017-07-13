import { ZipCode, r } from '../server/models'
import Baby from 'babyparse'

(async function () {
  try {
    const hasZip = (await r.table('zip_code')
      .limit(1)
      .count()) > 0

    if (!hasZip) {
      const absolutePath = 'src/server/seeds/data/zip-codes.csv'
      const { data, error } = Baby.parseFiles(absolutePath, {
        header: true
      })
      if (error) {
        throw new Error('Failed to seed zip codes')
      } else {
        const zipCodes = data.map((row) => ({
          zip: row.zip,
          city: row.city,
          state: row.state,
          timezone_offset: Number(row.timezone_offset),
          has_dst: Boolean(row.has_dst),
          location: {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude)
          }
        }))

        await ZipCode.save(zipCodes)
          .error((err) => log.error('error', err))
      }
    }
  } catch (ex) {
  }
})()
