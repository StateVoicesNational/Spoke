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
    sourceMap: true,
    compress: {
      // warnings: false, // Suppress uglification warnings
      pure_getters: true,
      // unsafe: true,
      // unsafe_comps: true,
      screw_ie8: true
    },
    output: {
      comments: false,
    }
  }))
  plugins.push(new webpack.LoaderOptionsPlugin({
    minimize: true
  }))
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin())
}

const config = {
  mode: (process.env.NODE_ENV || 'production'),
  entry: {
    bundle: [
      'babel-polyfill',
      'webpack-dev-server/client?http://0.0.0.0:3000',
      // Documentation is very confusing.
      // https://stackoverflow.com/a/43875921
      // https://github.com/webpack/webpack-dev-server/issues/703
      // https://github.com/webpack/webpack-dev-server/issues/615
      // 'webpack/hot/only-dev-server',
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
