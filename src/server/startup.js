import { r } from './models'

export let zipCodes = {}

export async function loadZipCodes() {
  const results = await r.table('zip_code')
    .coerceTo('array')
  results.forEach((doc) => {
    zipCodes[doc.zip] = {
      offset: doc.timezone_offset,
      hasDST: doc.has_dst
    }
  })

  console.log(Object.keys(zipCodes)[0], zipCodes['94114'], 'zips')
  console.log(Object.keys(zipCodes)[0], zipCodes[Object.keys(zipCodes)[0]], 'zips')
}

