import { createMemoryHistory, match } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import makeRoutes from '../../routes'
import renderIndex from './render-index'
import Store from '../../store'
import wrap from '../wrap'
import fs from 'fs'
import path from 'path'

const assetMap = {
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
  const memoryHistory = createMemoryHistory(req.url)
  const store = new Store(memoryHistory)
  const history = syncHistoryWithStore(memoryHistory, store.data)
  const authCheck = (nextState, replace) => {
    if (!req.isAuthenticated()) {
      replace({
        pathname: `/login?nextUrl=${nextState.location.pathname}`
      })
    }
  }
  const routes = makeRoutes(authCheck)
  match({
    history,
    routes,
    location: req.url
  }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message)
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      // this is really cool 'hyrdration' type tech which renders the html
      // on the server for each call.  However, using the ApolloClientSingleton
      // is problematic on the server, since its a little odd to require a network
      // connection with 'itself' to send /graphql requests.  And why bother anyway?
      /*
      const { html, css } = StyleSheetServer.renderStatic(() => renderToString(
        <ApolloProvider store={store.data} client={ApolloClientSingleton}>
          <RouterContext {...renderProps} />
        </ApolloProvider>
        )
      )
      */
      const html = ''
      const css = ''
      res.send(renderIndex(html, css, assetMap, store.data))
    } else {
      res.status(404).send('Not found')
    }
  })
})
