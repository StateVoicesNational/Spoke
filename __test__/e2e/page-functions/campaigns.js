const { until } = require('selenium-webdriver')
// const helpers = require('./util/helpers')
const pom = {}
pom.campaign = require('../page-objects/campaigns')

module.exports = {
  startCampaign(driver, campaign) {
    it('clicks the + button to add a new campaign', async () => {
      const el = await driver.wait(until.elementLocated(pom.campaign.add), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })

    it('fills in the Basics section', async () => {
      let el = await driver.wait(until.elementLocated(pom.campaign.form.basics.title), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(campaign.basics.title)
      el = await driver.findElement(pom.campaign.form.basics.description)
      await el.clear()
      await el.sendKeys(campaign.basics.description)
      el = await driver.findElement(pom.campaign.form.basics.dueBy)
    // ((JavascriptExecutor)driver).executeScript("document.getElementsByName("dueBy")[0].setAttribute('value','10 Jan 2019')")
      await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
      // await el.click()
      // await el.sendKeys(campaign.basics.dueBy)
      await driver.sleep(5000)
    })

    // Date notes
    // ((JavascriptExecutor)driver).executeScript("document.getElementsByName("dueBy")[0].setAttribute('value','10 Jan 2019')")

    xit('clicks the submit button', async () => {
      const el = await driver.findElement(pom.invite.organization.submit)
      await el.click()
    })
  }
}
