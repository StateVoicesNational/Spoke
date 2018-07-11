import fs from 'fs'
import path from 'path'

import renderIndex from './render-index'
import wrap from '../wrap'


let assetMap = {
  'bundle.js': '/assets/bundle.js'
}
if (process.env.NODE_ENV === 'production') {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      ((process.env.ASSETS_DIR || '').startsWith('.')
        ? path.join(__dirname,
                    '../../../../',
                    process.env.ASSETS_DIR,
                    process.env.ASSETS_MAP_FILE)
        : path.join(process.env.ASSETS_DIR,
                     process.env.ASSETS_MAP_FILE))
    )
  )
  const staticBase = process.env.STATIC_BASE_URL || '/assets/'
  for (var a in assetMapData) {
    assetMap[a] = staticBase + assetMapData[a]
  }
}

export default wrap(async (req, res) => {
  const html = '', css = ''
  res.send(renderIndex(html, css, assetMap))
})
