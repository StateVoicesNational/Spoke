const { until } = require('selenium-webdriver')

const remote = require('selenium-webdriver/remote')
import { wait } from '../util/helpers'
const pom = {}
pom.campaign = require('../page-objects/campaigns')
pom.navigation = require('../page-objects/navigation')

module.exports = {
  startCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await wait.andClick(driver, pom.navigation.sections.campaigns)
    })

    it('clicks the + button to add a new campaign', async () => {
      await wait.andClick(driver, pom.campaign.add)
    })

    it('completes the Basics section', async () => {
      // Title
      await wait.andType(driver, pom.campaign.form.basics.title, campaign.basics.title)
      // Description
      await wait.andType(driver, pom.campaign.form.basics.description, campaign.basics.description)
      // Select a Due Date using the Date Picker
      /**
       * Date Picker Notes:
       * The selector for the date is fragile. It may be better to programatically set it.
       * await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
       * Similarly, a sleep is added because it's difficult to know when the picker dialog is gone.
       */
      await wait.andClick(driver, pom.campaign.form.basics.dueBy)
      await wait.andClick(driver, pom.campaign.form.datePickerDialog.nextMonth)
      await driver.sleep(1000) // Transition
      await wait.andClick(driver, pom.campaign.form.datePickerDialog.enabledDate)
      await driver.sleep(3000)
      // Save
      await wait.andClick(driver, pom.campaign.form.save)
      // This should switch to the Contacts section
    })

    it('completes the Contacts section', async () => {
      await driver.setFileDetector(new remote.FileDetector()) // TODO: maybe this belongs earlier?
      const el = await driver.wait(until.elementLocated(pom.campaign.form.contacts.input), 10000)
      await el.sendKeys(campaign.contacts.csv)
      await wait.andGetEl(driver, pom.campaign.form.contacts.uploadedContacts)
      expect(await wait.andGetEl(driver, pom.campaign.form.contacts.uploadedContacts)).toBeDefined()
      // Save
      await wait.andClick(driver, pom.campaign.form.save)
      // This should switch to the Texters section
    })

    it('completes the Texters section (Dynamic assignment)', async () => {
      if (campaign.existingTexter) {
        // Add All
        await wait.andClick(driver, pom.campaign.form.texters.addAll)
        // Assign (Split)
        await wait.justLocateandClick(driver, pom.campaign.form.texters.autoSplit)
        // Validate Assignment
        expect(await wait.andGetValue(driver, pom.campaign.form.texters.texterAssignmentByIndex(0)) > 0).toBeTruthy()
        expect(await wait.andGetValue(driver, pom.campaign.form.texters.texterAssignmentByIndex(1)) > 0).toBeTruthy()
        // Assign (All to Texter)
        await wait.justLocateandClick(driver, pom.campaign.form.texters.autoSplit)
        await wait.andType(driver, pom.campaign.form.texters.texterAssignmentByIndex(1), campaign.texters.contactLength)
        // Bug?
        await wait.andType(driver, pom.campaign.form.texters.texterAssignmentByIndex(1), campaign.texters.contactLength)
        // Validate Assignment
        expect(await wait.andGetValue(driver, pom.campaign.form.texters.texterAssignmentByIndex(0))).toBe('0')
      }
      if (campaign.dynamicAssignment) {
        // Dynamically Assign
        await wait.justLocateandClick(driver, pom.campaign.form.texters.useDynamicAssignment)
        // Store the invite (join) URL into a global for future use.
        global.e2e.joinUrl = await wait.andGetValue(driver, pom.campaign.form.texters.joinUrl)
      }
      // Save
      await wait.andClick(driver, pom.campaign.form.save)
      // This should switch to the Interactions section
    })

    it('completes the Interactions section', async () => {
      // Script
      await wait.andClick(driver, pom.campaign.form.interactions.editorLaunch)
      const el = await driver.wait(until.elementLocated(pom.campaign.form.interactions.editor), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      await el.sendKeys(campaign.interaction.script)
      await wait.andClick(driver, pom.campaign.form.interactions.done)
      // Question
      await wait.andType(driver, pom.campaign.form.interactions.questionText, campaign.interaction.question)
      // Save
      await wait.andClick(driver, pom.campaign.form.interactions.submit)
      // This should switch to the Canned Responses section
    })

    it('completes the Canned Responses section', async () => {
      // Add New
      await wait.andClick(driver, pom.campaign.form.cannedResponse.addNew)
      // Title
      await wait.andType(driver, pom.campaign.form.cannedResponse.title, campaign.cannedResponses[0].title)
      // Script
      await wait.andClick(driver, pom.campaign.form.cannedResponse.editorLaunch)
      const el = await driver.wait(until.elementLocated(pom.campaign.form.cannedResponse.editor), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
      await el.sendKeys(campaign.cannedResponses[0].script)
      await wait.andClick(driver, pom.campaign.form.cannedResponse.done)
      // Script - Relaunch and cancel (bug?)
      await driver.sleep(3000) // Wait for script dialog to transition away
      await wait.andClick(driver, pom.campaign.form.cannedResponse.editorLaunch)
      await wait.andClick(driver, pom.campaign.form.cannedResponse.cancel)
      await driver.sleep(3000) // Wait for script dialog to transition away
      // Submit Response
      await wait.andClick(driver, pom.campaign.form.cannedResponse.submit)
      // Save
      await wait.andClick(driver, pom.campaign.form.save)
    })

    it('clicks Start Campaign', async () => {
      await wait.andClick(driver, pom.campaign.start)
      // Validate Started
      await wait.andGetEl(driver, pom.campaign.isStarted)
    })
  }
}
