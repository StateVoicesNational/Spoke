import WebpackDevServer from 'webpack-dev-server'
import webpack from 'webpack'
import config from './config'
import { log } from '../src/lib'

const webpackPort = process.env.WEBPACK_PORT || 3000
const appPort = process.env.DEV_APP_PORT
const webpackHost = process.env.WEBPACK_HOST || '127.0.0.1'

Object.keys(config.entry)
.forEach((key) => {
  config.entry[key].unshift(`webpack-dev-server/client?http://${webpackHost}:${webpackPort}/`)
  config.entry[key].unshift('webpack/hot/only-dev-server')
})

const compiler = webpack(config)
const connstring = `http://127.0.0.1:${appPort}`

log.info(`Proxying requests to:${connstring}`)

const app = new WebpackDevServer(compiler, {
  contentBase: '/assets/',
  publicPath: '/assets/',
  hot: true,
  // this should be temporary until we get the real hostname plugged in everywhere
  disableHostCheck: true,
  headers: { 'Access-Control-Allow-Origin': '*' },
  proxy: {
    '*': `http://127.0.0.1:${appPort}`
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: false,
    errorDetails: false,
    warnings: true,
    publicPath: false
  }
})

app.listen(webpackPort, () => {
  log.info(`Webpack dev server is now running on http://${webpackHost}:${webpackPort}`)
})
