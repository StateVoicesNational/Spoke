export const getFormattedZip = (zip, country = 'US') => {
  if (country === 'US') {
    const regex = /(\d{5})([ \-]\d{4})?/
    const [, first5] = zip.match(regex) || []

    return first5
  }
  throw new Error(`Do not know how to format zip for country: ${country}`)
}

const commonZipRanges = [
  // list of zip ranges. [<firstZip>, <lastZip>, <timezone>, <hasDst>, <zipCount>]
  [1001, 32401, -5, 1, 31400],
  [70000, 79821, -6, 1, 9821],
  [60001, 67733, -6, 1, 7732],
  [49990, 57521, -6, 1, 7531],
  [84001, 88901, -7, 1, 4900],
  [92663, 96371, -8, 1, 3708],
  [79901, 83501, -7, 1, 3600],
  [42788, 46301, -5, 1, 3513],
  [89025, 92132, -8, 1, 3107],
  [32601, 35004, -5, 1, 2403],
  [35004, 37302, -6, 1, 2298],
  [38001, 39901, -6, 1, 1900],
  [40179, 42001, -5, 1, 1822],
  [47980, 49801, -5, 1, 1821],
  [98001, 99501, -8, 1, 1500],
  [67880, 69021, -6, 1, 1141],
  [59000, 60001, -7, 1, 1001],
  [46415, 47412, -5, 1, 997],
  [97001, 97901, -8, 1, 900],
  [69301, 70000, -7, 1, 699],
  [57840, 58529, -6, 1, 689],
  [96371, 97001, -10, 1, 630],
  [92133, 92662, -8, 1, 529],
  [601, 1001, -4, 1, 400],
  [210, 601, -5, 1, 391],
  [42001, 42253, -6, 1, 252],
  [42254, 42501, -6, 1, 247],
  [-1, 210, -4, -1, 211],
  [83801, 84001, -8, 1, 200],
  [83601, 83801, -7, 1, 200],
  [47765, 47922, -5, 1, 157],
  [57683, 57840, -7, 1, 157],
  [58843, 59000, -6, 1, 157],
  [58701, 58838, -6, 1, 137],
  [88901, 89024, -8, 1, 123],
  [37601, 37723, -5, 1, 122],
  [37724, 37838, -5, 1, 114],
  [40003, 40106, -5, 1, 103],
  [47420, 47523, -5, 1, 103],
  [42501, 42602, -5, 1, 101],
  [37401, 37501, -5, 1, 100],
  [37501, 37601, -6, 1, 100]
]

commonZipRanges.sort((a, b) => (a[0] - b[0]))

export const zipToTimeZone = (zip) => {
  // will search common zip ranges -- won't necessarily find something
  // so fallback on looking it up in db
  if (typeof zip === 'number' || zip.length >= 5) {
    const parsed = parseInt(zip, 10)
    return commonZipRanges.find((g) => (parsed >= g[0] && parsed < g[1]))
  }
  return null
}

// export const findZipRanges = function (r) {
//   var zipchanges = []
//   return r.knex('zip_code').select('zip', 'timezone_offset', 'has_dst')
//     .orderBy('zip').then(function (zips) {
//       var front = -1
//       var curTz = -4
//       var curHasDst = -1
//       zips.forEach((zipRec) => {
//         if (zipRec.timezone_offset != curTz || zipRec.has_dst != curHasDst) {
//           zipchanges.push([front, parseInt(zipRec.zip), curTz, curHasDst, parseInt(zipRec.zip) - front])
//           curTz = zipRec.timezone_offset
//           curHasDst = zipRec.has_dst
//           front = parseInt(zipRec.zip)
//         }
//       })
//       zipchanges.sort(function (a, b) { return b[4] - a[4] })
//       console.log(zipchanges)
//     })
//   return zipchanges
// }
