const { until } = require('selenium-webdriver')
const path = require('path')
const remote = require('selenium-webdriver/remote')
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

    it('completes the Basics section', async () => {
      // Title
      let el = await driver.wait(until.elementLocated(pom.campaign.form.basics.title), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(campaign.basics.title)
      // Description
      el = await driver.findElement(pom.campaign.form.basics.description)
      await el.clear()
      await el.sendKeys(campaign.basics.description)
      // Select a Due Date using the Date Picker
      /**
       * Date Picker Notes:
       * The selector for the date is fragile. It may be better to programatically set it.
       * await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
       * Similarly, a sleep is added because it's difficult to know when the picker dialog is gone.
       */
      el = await driver.findElement(pom.campaign.form.basics.dueBy)
      await el.click()
      el = await driver.wait(until.elementLocated(pom.campaign.form.datePickerDialog.nextMonth), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      el = await driver.wait(until.elementLocated(pom.campaign.form.datePickerDialog.enabledDate), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      await driver.sleep(3000)
      // Save
      el = await driver.wait(until.elementLocated(pom.campaign.form.save), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // This should switch to the Contacts section
    })

    it('completes the Contacts section', async () => {
      await driver.setFileDetector(new remote.FileDetector()) // TODO: maybe this belongs earlier?
      let el = await driver.wait(until.elementLocated(pom.campaign.form.contacts.input), 10000)
      await el.sendKeys(path.resolve(__dirname, '../data/people.csv'))
      // TODO: Wait for upload confirmation / summary
      // Save
      el = await driver.wait(until.elementLocated(pom.campaign.form.save), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // This should switch to the Texters section
    })

    it('completes the Texters section (Dynamic assignment)', async () => {
      let el = await driver.wait(until.elementLocated(pom.campaign.form.texters.useDynamicAssignment), 10000)
      await el.click()

      // Store the invite (join) URL into a global for future use.
      el = await driver.wait(until.elementLocated(pom.campaign.form.texters.joinUrl), 20000)
      await driver.wait(until.elementIsVisible(el))
      global.e2e.joinUrl = await el.getAttribute('value')
      // Save
      el = await driver.wait(until.elementLocated(pom.campaign.form.save), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // This should switch to the Interactions section
    })

    it('completes the Interactions section', async () => {
      // Script
      let el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.editorLaunch), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.editor), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      await el.sendKeys(campaign.interaction.script)
      el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.done), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // Question
      el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.questionText), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(campaign.interaction.question)
      // Save
      el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.submit), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // This should switch to the Canned Responses section
    })

    it('completes the Canned Responses section', async () => {
      // Add New
      let el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.addNew), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // Title
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.title), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(campaign.cannedResponses[0].title)
      // Script
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.editorLaunch), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.editor), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      await el.sendKeys(campaign.cannedResponses[0].script)
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.done), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // Script - Relaunch and cancel (bug?)
      await driver.sleep(3000) // Wait for script dialog to transition away
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.editorLaunch), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.cancel), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      // Submit Response
      el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.submit), 10000)
      await driver.wait(until.elementIsVisible(el))
      // Save
      el = await driver.wait(until.elementLocated(pom.campaign.form.save), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })

    it('clicks start campaign', async () => {
      // TODO
    })
  }
}
