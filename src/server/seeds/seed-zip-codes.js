import { ZipCode, r } from '../models'
import Baby from 'babyparse'
import { log } from '../../lib'

export async function seedZipCodes() {
  log.info('Checking if zip code is needed')
  const hasZip = (await r.table('zip_code')
    .filter({})
    .limit(1)
    .count()) > 0
  if (!hasZip) {
    log.info('Starting to seed zip codes')
    const absolutePath = `${__dirname}/data/zip-codes.csv`
    const { data, error } = Baby.parseFiles(absolutePath, {
      header: true
    })
    if (error) {
      throw new Error('Failed to seed zip codes')
    } else {
      log.info('Parsed a CSV with ', data.length, ' zip codes')
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

      log.info(zipCodes.length, 'ZIP CODES')
      ZipCode.save(zipCodes)
        .then(() => log.info('Finished seeding'))
        .error((err) => log.error('error', err))
    }
  }
}
