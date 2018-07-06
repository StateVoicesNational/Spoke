const { Builder, until } = require('selenium-webdriver')
const config = require('./config')
const defaultWait = 10000

const selenium = {
  buildDriver() {
    return process.env.npm_config_saucelabs ?
      new Builder()
        .withCapabilities(config.sauceLabs.capabilities)
        .usingServer(config.sauceLabs.server)
        .build() :
      new Builder().forBrowser('chrome').build()
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

const wait = {
  async andGetEl(driver, locator, msWait) {
    const el = await driver.wait(until.elementLocated(locator, msWait || defaultWait))
    return await driver.wait(until.elementIsVisible(el))
  },
  async andClick(driver, locator, msWait) {
    const el = await driver.wait(until.elementLocated(locator, msWait || defaultWait))
    await driver.wait(until.elementIsVisible(el))
    await el.click()
  },
  async justLocateandClick(driver, locator, msWait) {
    // Useful for items (like some checkbox inputs) that don't work with isVisible
    const el = await driver.wait(until.elementLocated(locator, msWait || defaultWait))
    await el.click()
  },
  async andType(driver, locator, keys, msWait) {
    const el = await driver.wait(until.elementLocated(locator, msWait || defaultWait))
    await driver.wait(until.elementIsVisible(el))
    await el.clear()
    await el.sendKeys(keys)
  },
  async andGetValue(driver, locator, msWait) {
    const el = await driver.wait(until.elementLocated(locator, msWait || defaultWait))
    await driver.wait(until.elementIsVisible(el))
    return await el.getAttribute('value')
  },
  async untilLocated(driver, locator, msWait) {
    await driver.wait(until.elementLocated(locator, msWait || defaultWait))
  }
}

export { selenium, wait }
