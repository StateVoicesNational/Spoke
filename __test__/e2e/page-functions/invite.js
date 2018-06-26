const { until } = require('selenium-webdriver')
// const helpers = require('./util/helpers')
const pom = {}
pom.invite = require('../page-objects/invite')

module.exports = {
  createOrg(driver, name) {
    it('fills in the organization name', async () => {
      const el = await driver.wait(until.elementLocated(pom.invite.organization.name), 20000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(name)
    })

    it('clicks the submit button', async () => {
      const el = await driver.findElement(pom.invite.organization.submit)
      await el.click()
    })
  }
}
