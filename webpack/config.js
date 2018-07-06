const path = require('path')
const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')

const DEBUG = process.env.NODE_ENV !== 'production'

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
    'process.env.PHONE_NUMBER_COUNTRY': `"${process.env.PHONE_NUMBER_COUNTRY}"`
  }),
  new webpack.ContextReplacementPlugin(
    /[\/\\]node_modules[\/\\]timezonecomplete[\/\\]/,
    path.resolve("tz-database-context"),
    {
      "tzdata": "tzdata",
    }
  )
]
const jsxLoaders = [{loader: 'babel-loader'}]
const assetsDir = process.env.ASSETS_DIR
const assetMapFile = process.env.ASSETS_MAP_FILE
const outputFile = DEBUG ? '[name].js' : '[name].[chunkhash].js'

if (!DEBUG) {
  plugins.push(new ManifestPlugin({
    fileName: assetMapFile
  }))
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    sourceMap: true
  }))
  plugins.push(new webpack.LoaderOptionsPlugin({
    minimize: true
  }))
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin())
}

const config = {
  entry: {
    bundle: [
      'webpack-dev-server/client?http://127.0.0.1:3000',
      'webpack/hot/only-dev-server',
      'babel-polyfill',
      './src/client/index.jsx'
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'}
        ]
      },
      {
        test: /\.jsx?$/,
        use: jsxLoaders,
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins,
  output: {
    filename: outputFile,
    path: path.resolve(DEBUG ? __dirname : assetsDir),
    publicPath: '/assets/'
  }
}

if (DEBUG) {
  config.devtool = '#inline-source-map'
  config.output.sourceMapFilename = `${outputFile}.map`
}

module.exports = config
