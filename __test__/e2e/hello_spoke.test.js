const { By, until } = require('selenium-webdriver')
const config = require('./util/config')
const helpers = require('./util/helpers')

// promise.USE_PROMISE_MANAGER = false; //TODO: This was recommended by Selenum but it doesn't work.

describe('Signing up a new user to Spoke', () => {
  let driver

  beforeAll(async () => {
    driver = await helpers.selenium.buildDriver()
  })

  afterAll(async () => {
    await helpers.selenium.quitDriver(driver)
  })

  it('gets the guinea pig page', async () => {
    await driver.get('http://saucelabs.com/test/guinea-pig')
  })

  it('gets the landing page', async () => {
    await driver.get(config.baseUrl)
  })

  it('clicks the login link', async () => {
    const loginUrl = `${config.baseUrl}/login`
    const el = await driver.findElement(By.css('#login'))
    await driver.wait(until.elementIsVisible(el))
    await el.click()
    await driver.wait(until.urlContains(loginUrl))

    // Example of a validation statement.
    const url = await driver.getCurrentUrl()
    expect(url).toContain(loginUrl)

    // https://facebook.github.io/jest/docs/en/jest-platform.html
  })
})
