module.exports = function(config) {
  config.set({
    // ... normal karma configuration
    files: [
      // all files ending in "_test"
      '**/*.spec.js'
      // each file acts as entry point for the webpack configuration
    ],

    preprocessors: {
      // add webpack as preprocessor
      'test/*_test.js': ['webpack'],
      'test/**/*_test.js': ['webpack'],
      '**/*.spec.js': ['webpack', 'sourcemap']
    },

    webpack: {
      // karma watches the test entry points
      // (you don't need to specify the entry option)
      // webpack watches dependencies

      // webpack configuration
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    browsers: [ 'Chrome' ], //run in Chrome
    singleRun: true, //just run once by default
    frameworks: [ 'mocha', 'chai'] //use the mocha test framework
  });
};