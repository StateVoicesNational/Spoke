const sauceLabs = {
  username: 'cp4r3zsl',
  accessKey: 'd00a6baf-4b34-4790-a9cb-ed0bdf1303ff'
}
// const sauceLabs = {
//   username: process.env.SAUCE_USERNAME,
//   accessKey: process.env.SAUCE_ACCESS_KEY
// }

module.exports = {
  baseUrl: global.BASE_URL,
  // TODO: Figure out what the long term user is
  sauceLabs: {
    /**
     * TODO: The Sauce Connect addon exports the SAUCE_USERNAME and SAUCE_ACCESS_KEY
     * environment variables, and relays connections to the hub URL back to Sauce Labs.
     */
    username: sauceLabs.username,
    accessKey: sauceLabs.accessKey,
    capabilities: {
      name: 'Travis-CI - Chrome E2E Tests',
      browserName: 'chrome',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      username: sauceLabs.username,
      accessKey: sauceLabs.accessKey,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    server: `http://${sauceLabs.username}:${sauceLabs.accessKey}@ondemand.saucelabs.com:80/wd/hub`,
    host: 'localhost',
    port: 4445
  }
}
