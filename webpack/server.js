import WebpackDevServer from 'webpack-dev-server'
import webpack from 'webpack'
import config from './config'
import { log } from '../src/lib'

const webpackPort = 3000
const appPort = process.env.DEV_APP_PORT

Object.keys(config.entry)
.forEach((key) => {
  config.entry[key].unshift(`webpack-dev-server/client?http://localhost:${webpackPort}/`)
  config.entry[key].unshift('webpack/hot/only-dev-server')
})

const compiler = webpack(config)
const connstring = `http://localhost:${appPort}`

log.info(`Proxying requests to:${connstring}`)

const app = new WebpackDevServer(compiler, {
  contentBase: '/assets/',
  publicPath: '/assets/',
  hot: true,
  headers: { 'Access-Control-Allow-Origin': '*' },
  proxy: {
    '*': `http://localhost:${appPort}`
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
    warnings: false,
    publicPath: false
  }
})

app.listen(webpackPort, () => {
  log.info(`Webpack dev server is now running on http://localhost:${webpackPort}`)
})
