import { renderToString } from 'react-dom/server'
import { createMemoryHistory, match, RouterContext } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { StyleSheetServer } from 'aphrodite'
import makeRoutes from '../../routes'
import { ApolloProvider } from 'react-apollo'
import ApolloClientSingleton from '../../network/apollo-client-singleton'
import React from 'react'
import renderIndex from './render-index'
import Store from '../../store'
import wrap from '../wrap'
import fs from 'fs'
import path from 'path'

let assetMap = {
  'bundle.js': '/assets/bundle.js'
}
if (process.env.NODE_ENV === 'production') {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      path.join(process.env.ASSETS_DIR, process.env.ASSETS_MAP_FILE)
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
      const { html, css } = StyleSheetServer.renderStatic(() => renderToString(
        <ApolloProvider store={store.data} client={ApolloClientSingleton}>
          <RouterContext {...renderProps} />
        </ApolloProvider>
        )
      )

      res.send(renderIndex(html, css, assetMap, store.data))
    } else {
      res.status(404).send('Not found')
    }
  })
})
