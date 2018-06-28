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
      // Enter a title
      let el = await driver.wait(until.elementLocated(pom.campaign.form.basics.title), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(campaign.basics.title)
      // Enter a description
      el = await driver.findElement(pom.campaign.form.basics.description)
      await el.clear()
      await el.sendKeys(campaign.basics.description)
      // Select a Due Date using the Date Picker
      el = await driver.findElement(pom.campaign.form.basics.dueBy)
      await el.click()
      const enabledDate = await driver.wait(until.elementLocated(pom.campaign.form.datePickerDialog.enabledDate), 10000)
      await driver.wait(until.elementIsVisible(enabledDate))
      await enabledDate.click()
      await driver.sleep(2000)
      // Date Picker Notes:
      // The selector for the date is fragile. It may be better to programatically set it.
      // await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
      // Similarly, a sleep is added because it's difficult to know when the picker dialog is gone.
    })

    it('clicks the save button', async () => {
      const el = await driver.wait(until.elementLocated(pom.campaign.form.save), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })
  }
}
