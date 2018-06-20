const { Builder, By, until } = require('selenium-webdriver')
const config = require('./util/config')
console.log(`config.baseUrl: ${config.baseUrl}`)
// promise.USE_PROMISE_MANAGER = false; //TODO: This was recommended by Selenum but it doesn't work.

describe('Signing up a new user to Spoke', () => {
  let driver

  beforeAll(async () => {
    driver = process.env.npm_config_saucelabs ?
      await new Builder()
        .withCapabilities(config.sauceLabs.capabilities)
        .usingServer(config.sauceLabs.server)
        .build() :
      await new Builder().forBrowser('chrome').build()
  })

  afterAll(async () => {
    // Maybe this needs to be on teardown?
    // https://facebook.github.io/jest/docs/en/configuration.html#globalteardown-string
    // https://wiki.saucelabs.com/display/DOCS/Outputting+the+Bamboo+Session+ID+to+stdout
    await driver.getSession()
      .then(session => {
        const sessionId = session.getId()
        process.env.SELENIUM_ID = sessionId
        console.log(`SauceOnDemandSessionID=${sessionId} job-name=${process.env.TRAVIS_JOB_NUMBER}`)
      })
    await driver.quit()
  })

  it('gets the guinea pig page', async () => {
    await driver.get('http://saucelabs.com/test/guinea-pig')
  })

  it('gets the landing page', async () => {
    await driver.get(config.baseUrl)
  })

  xit('clicks the login link', async () => {
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
