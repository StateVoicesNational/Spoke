import { r } from '../server/models'
import Baby from 'babyparse'

(async function () {
  async function sleep(ms = 0) {
    return new Promise(fn => setTimeout(fn, ms))
  }
  console.log('Started at ', new Date())
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
      console.log(`${new Date()}\t${Math.round(i * 100 / count)}% zips processed\tUpdated ${result.replaced} contacts for zip\t ${zip.zip}\tTotal  contacts: ${totalCount}`)
      // await sleep(sleepTime)
    }

    console.log('Done with all zips!')
  } catch (ex) {
    console.log(ex)
  }
})()
