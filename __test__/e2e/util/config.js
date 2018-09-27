const config = {
  baseUrl: global.BASE_URL,
  sauceLabs: {
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    capabilities: {
      name: 'Spoke - Chrome E2E Tests',
      browserName: 'chrome',
      'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      build: process.env.TRAVIS_BUILD_NUMBER
    },
    server: `http://${process.env.SAUCE_USERNAME}:${process.env.SAUCE_ACCESS_KEY}@ondemand.saucelabs.com:80/wd/hub`,
    host: 'localhost',
    port: 4445
  }
}

export default config
