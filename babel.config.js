
// The .babelrc config file takes priority for app compilation.
// For running Jest tests, this file takes precedence over the settings in .babelrc

module.exports = {
    presets: [
      "@babel/preset-react",
      "@babel/preset-env",
      ["@babel/preset-typescript", { allExtensions: true, isTSX: true }]
    ],
    only: ["./**/*.js", "./**/*.jsx"],
    plugins: [
      "@babel/plugin-proposal-export-default-from",
      [
        "@babel/plugin-transform-runtime",
        {
          regenerator: true
        }
      ]
    ],
    env: {
      dev: {
        plugins: ["react-hot-loader/babel"]
      }
    }
  };