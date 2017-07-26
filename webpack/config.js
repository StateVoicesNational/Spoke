const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const spokeConfig = require('../spoke.config')

const DEBUG = spokeConfig.NODE_ENV !== 'production'

const plugins = [
  new webpack.DefinePlugin({
    'spokeConfig.NODE_ENV': `"${spokeConfig.NODE_ENV}"`
  })
]
const jsxLoaders = ['babel-loader']
const assetsDir = spokeConfig.ASSETS_DIR
const assetMapFile = spokeConfig.ASSETS_MAP_FILE
const outputFile = DEBUG ? '[name].js' : '[name].[chunkhash].js'

if (!DEBUG) {
  plugins.push(new ManifestPlugin({
    fileName: assetMapFile
  }))
  plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }))
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin())
  jsxLoaders.unshift('react-hot')
}

const config = {
  entry: {
    bundle: ['babel-polyfill', './src/client/index.jsx']
  },
  module: {
    noParse: [],
    loaders: [
      {
        test: /node_modules[\\\/]auth0-lock[\\\/].*\.js$/,
        loaders: [
          'transform-loader/cacheable?brfs',
          'transform-loader/cacheable?packageify'
        ]
      },
      {
        test: /node_modules[\\\/]auth0-lock[\\\/].*\.ejs$/,
        loader: 'transform-loader/cacheable?ejsify'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      { test: /\.css$/, loader: 'style!css' },
      {
        test: /\.jsx?$/,
        loaders: jsxLoaders,
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins,
  output: {
    filename: outputFile,
    path: assetsDir,
    publicPath: '/assets/',
    sourceMapFilename: `${outputFile}.map`
  }
}

if (DEBUG) {
  config.devtool = '#inline-source-map'
} else if (spokeConfig.NODE_ENV === 'production') {
  config.devtool = 'source-map'
}

module.exports = config
