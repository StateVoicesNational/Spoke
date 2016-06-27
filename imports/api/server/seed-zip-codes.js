import { ZipCodes } from '../zip_codes/zip_codes.js'
import Baby from 'babyparse'
import { batchInsert } from 'meteor/mikowals:batch-insert'

export const seedZipCodes = () => {
  if (!ZipCodes.findOne()) {
    const absolutePath = `${process.env.PWD}/imports/api/server/data/zip-codes.csv`
    const { data, error } = Baby.parseFiles(absolutePath, {
      header: true
    })
    if (error) {
      throw new Error('Failed to seed zip codes')
    } else {
      const zipCodes = data.map((row) => _.extend(row, {
        timezoneOffset: Number(row.timezoneOffset),
        hasDst: Boolean(row.hasDst),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude)
      }))
      ZipCodes.batchInsert(zipCodes)
    }
  }
}