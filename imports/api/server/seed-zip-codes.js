import { ZipCodes } from '../zip_codes/zip_codes.js'
import Baby from 'babyparse'

export const seedZipCodes = () => {
  console.log("Checking if zip code is needed")
  if (!ZipCodes.findOne()) {
    console.log("Starting to seed zip codes")
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
      _.each(zipCodes, (zipCode) =>  {
        try {
          ZipCodes.insert(zipCode)
        } catch (ex) {
          console.log("Failed to insert", zipCode)
        }

      })

      console.log("Finishing seeding", ZipCodes.find({}).count())
      // This is throwing an error when deployed for some reason
      // "MongoError: Invalid Operation, No operations in bulk"
      // ZipCodes.batchInsert(zipCodes)
    }
  }
}