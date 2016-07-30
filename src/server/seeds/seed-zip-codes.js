import { ZipCode, r } from '../models'
import Baby from 'babyparse'

export async function seedZipCodes() {
  console.log('Checking if zip code is needed')
  const hasZip = (await r.table('zip_code')
    .filter({})
    .limit(1)
    .count()) > 0
  if (!hasZip) {
    console.log('Starting to seed zip codes')
    const absolutePath = `${__dirname}/data/zip-codes.csv`
    console.log(absolutePath)
    const { data, error } = Baby.parseFiles(absolutePath, {
      header: true
    })
    if (error) {
      throw new Error('Failed to seed zip codes')
    } else {
      console.log('Parsed a CSV with ', data.length, ' zip codes')
      const zipCodes = data.map((row) => {
        return {
          zip: row.zip,
          city: row.city,
          state: row.state,
          timezone_offset: Number(row.timezone_offset),
          has_dst: Boolean(row.has_dst),
          location: {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude)
          }
        }
      })

      console.log(zipCodes.length, 'ZIP CODES')
      ZipCode.save(zipCodes).then((result) => console.log('Finished seeding')).error((error) => console.log('error', error))
    }
  }
}
