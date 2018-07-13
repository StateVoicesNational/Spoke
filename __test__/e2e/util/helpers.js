import { Builder, until } from 'selenium-webdriver'
import remote from 'selenium-webdriver/remote'
import config from './config'
import _ from 'lodash'

const defaultWait = 10000

export const selenium = {
  buildDriver() {
    const driver = process.env.npm_config_saucelabs ?
      new Builder()
        .withCapabilities(config.sauceLabs.capabilities)
        .usingServer(config.sauceLabs.server)
        .build() :
      new Builder().forBrowser('chrome').build()
    driver.setFileDetector(new remote.FileDetector())
    return driver
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

export const urlBuilder = {
  login: `${config.baseUrl}/login`,
  admin: {
    root() { return `${config.baseUrl}/admin/${global.e2e.organization}` }
  },
  app: {
    todos() { return `${config.baseUrl}/app/${global.e2e.organization}/todos` }
  }
}

const waitAnd = async (driver, locator, options) => {
  const el = await driver.wait(until.elementLocated(locator, options.msWait || defaultWait))
  if (options.elementIsVisible !== false) await driver.wait(until.elementIsVisible(el))
  if (options.click) await el.click()
  if (options.clear) await el.clear()
  if (options.keys) await el.sendKeys(options.keys)
  return el
}

export const wait = {
  async untilLocated(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({}, options))
  },
  async andGetEl(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({}, options))
  },
  async andClick(driver, locator, options) {
    return await waitAnd(driver, locator, _.assign({ click: true }, options))
  },
  async andType(driver, locator, keys, options) {
    return await waitAnd(driver, locator, _.assign({ keys, clear: true }, options))
  },
  async andGetValue(driver, locator, options) {
    const el = await waitAnd(driver, locator, _.assign({}, options))
    return await el.getAttribute('value')
  },
  async andIsEnabled(driver, locator, options) {
    const el = await waitAnd(driver, locator, _.assign({}, options))
    return await el.isEnabled()
  }
}
