import { r } from '../server/models'
import Baby from 'babyparse'

(async function () {
  async function sleep(ms = 0) {
    return new Promise(fn => setTimeout(fn, ms))
  }

  const cachedTimezoneOffsetStrings = new Map()
  const zips = await r.table('zip_code')
      .pluck('zip', 'timezone_offset', 'has_dst')
      .coerceTo('array')
  zips.forEach((zip) => cachedTimezoneOffsetStrings.set(zip.zip,`${zip.timezone_offset}_${zip.has_dst}`))
  const limit = 100
  const sleepTime = 1000

  let totalCount = 0
  let loadMore = true

  console.log("Started at ", new Date())
  try {
    while (loadMore) {
      const contacts = await r.table('campaign_contact')
      .filter(r.row.hasFields('timezone_offset').not())
      .limit(limit)

      const count = contacts.length
      totalCount += count
      if (count === 0) {
          console.log("Done migrating at ", new Date())
          loadMore = false
      }
      else {
        for (let i=0; i < count; i++) {
          const contact = contacts[i]
          let cachedTimezoneOffset = ''
          if (contact.zip) {
            const regex = /(\d{5})([ \-]\d{4})?/
            let [, first5] = contact.zip.match(regex) || []
            if (first5) {
              const cachedKey = cachedTimezoneOffsetStrings.get(first5)
              if (cachedKey) {
                cachedTimezoneOffset = cachedKey
              }
            }
          }
          await r.table('campaign_contact')
            .get(contact.id)
            .update({ timezone_offset: cachedTimezoneOffset })
        }

        console.log("Sleeping for 1s: completed ", totalCount )
        await sleep(sleepTime)
      }
    }
  } catch (ex) {
    console.log(ex)
  }
})()
