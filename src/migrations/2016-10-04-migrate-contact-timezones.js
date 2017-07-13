import { r } from '../server/models'
import Baby from 'babyparse'

(async function () {
  async function sleep(ms = 0) {
    return new Promise(fn => setTimeout(fn, ms))
  }
  try {
    const zips = await r.table('zip_code')
      .pluck('zip', 'timezone_offset', 'has_dst')

    let totalCount = 0

    const count = zips.length
    for (let i = 0; i < count; i++) {
      const zip = zips[i]
      const cachedTimezoneOffset = `${zip.timezone_offset}_${zip.has_dst}`
      const result = await r.table('campaign_contact')
        .getAll(zip.zip, { index: 'zip' })
        .update({ timezone_offset: cachedTimezoneOffset })
      totalCount += result.replaced
      // await sleep(sleepTime)
    }
  } catch (ex) {
  }
})()
