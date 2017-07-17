const webpack = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')

const DEBUG = process.env.NODE_ENV !== 'production'

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`
  })
]
const jsxLoaders = ['babel-loader']
const assetsDir = process.env.ASSETS_DIR
const assetMapFile = process.env.ASSETS_MAP_FILE
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

webpackConfig.externals = webpackConfig.externals || {};
webpackConfig.externals['react/lib/ExecutionEnvironment'] = true;
webpackConfig.externals['react/lib/ReactContext'] = true;
webpackConfig.externals['react/addons'] = true;

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
        test: /sinon\.js$/,
        loader: 'imports?define=>false,require=>false'
      },
      {
        test: /\.json$/,
        include: [
          /node_modules/,
          path.resolve(__dirname, '..')
        ],
        loader: 'json-loader'
      },
      { test: /\.css$/, loader: 'style!css' },
      {
        test: /\.jsx?$/,
        loaders: jsxLoaders,
        exclude: /(node_modules|bower_components)/
      }

    ],
    rules: [
      {
        test: /\.json$/,
        use: 'json-loader'
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins,
  output: {
    filename: outputFile,
    path: DEBUG ? '/' : assetsDir,
    publicPath: '/assets/',
    sourceMapFilename: `${outputFile}.map`
  }
}

if (DEBUG) {
  config.devtool = '#inline-source-map'
} else if (process.env.NODE_ENV === 'production') {
  config.devtool = 'source-map'
}

module.exports = config
