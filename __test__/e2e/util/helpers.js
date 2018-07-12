const { Builder } = require('selenium-webdriver')
const config = require('./config')

module.exports = {
  selenium: {
    async buildDriver() {
      return process.env.npm_config_saucelabs ?
        await new Builder()
          .withCapabilities(config.sauceLabs.capabilities)
          .usingServer(config.sauceLabs.server)
          .build() :
        await new Builder().forBrowser('chrome').build()
    },
    async quitDriver(driver) {
      await driver.getSession()
        .then(session => {
          const sessionId = session.getId()
          process.env.SELENIUM_ID = sessionId
          console.log(`SauceOnDemandSessionID=${sessionId} job-name=${process.env.TRAVIS_JOB_NUMBER}`)
        })
      await driver.quit()
    }
  }
}
