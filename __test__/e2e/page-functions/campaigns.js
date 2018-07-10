/**
 * Date Picker Notes:
 * The selector for the date is fragile. It may be better to programatically set it.
 * await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
 * Similarly, a sleep is added because it's difficult to know when the picker dialog is gone.
 */

import { wait } from '../util/helpers'
import pom from '../page-objects/index'

export const campaigns = {
  startCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await wait.andClick(driver, pom.navigation.sections.campaigns)
    })

    it('clicks the + button to add a new campaign', async () => {
      await wait.andClick(driver, pom.campaigns.add)
    })

    it('completes the Basics section', async () => {
      // Title
      await wait.andClick(driver, pom.campaigns.form.basics.title)
      await wait.andType(driver, pom.campaigns.form.basics.title, campaign.basics.title)
      // Description
      await wait.andType(driver, pom.campaigns.form.basics.description, campaign.basics.description)
      // Select a Due Date using the Date Picker
      await wait.andClick(driver, pom.campaigns.form.basics.dueBy)
      await wait.andClick(driver, pom.campaigns.form.datePickerDialog.nextMonth)
      await driver.sleep(1000)
      await wait.andClick(driver, pom.campaigns.form.datePickerDialog.enabledDate)
      await driver.sleep(3000)
      // Save
      await wait.andClick(driver, pom.campaigns.form.save)
      // This should switch to the Contacts section
      expect(await wait.andGetEl(driver, pom.campaigns.form.contacts.uploadButton)).toBeDefined()
    })

    it('completes the Contacts section', async () => {
      await wait.andType(driver, pom.campaigns.form.contacts.input, campaign.contacts.csv, { clear: false, elementIsVisible: false })
      expect(await wait.andGetEl(driver, pom.campaigns.form.contacts.uploadedContacts)).toBeDefined()
      // Save
      await wait.andClick(driver, pom.campaigns.form.save)
      // This should switch to the Texters section
      expect(await wait.andGetEl(driver, pom.campaigns.form.texters.addAll)).toBeDefined()
    })

    it('completes the Texters section (Dynamic assignment)', async () => {
      if (campaign.existingTexter) {
        // Add All
        await wait.andClick(driver, pom.campaigns.form.texters.addAll)
        // Assign (Split)
        await wait.andClick(driver, pom.campaigns.form.texters.autoSplit, { elementIsVisible: false })
        // Validate Assignment
        expect(await wait.andGetValue(driver, pom.campaigns.form.texters.texterAssignmentByIndex(0)) > 0).toBeTruthy()
        expect(await wait.andGetValue(driver, pom.campaigns.form.texters.texterAssignmentByIndex(1)) > 0).toBeTruthy()
        // Assign (All to Texter)
        await wait.andClick(driver, pom.campaigns.form.texters.autoSplit, { elementIsVisible: false })
        await wait.andType(driver, pom.campaigns.form.texters.texterAssignmentByIndex(1), campaign.texters.contactLength)
        // Validate Assignment
        expect(await wait.andGetValue(driver, pom.campaigns.form.texters.texterAssignmentByIndex(0))).toBe('0')
      }
      if (campaign.dynamicAssignment) {
        // Dynamically Assign
        await wait.andClick(driver, pom.campaigns.form.texters.useDynamicAssignment, { elementIsVisible: false })
        // Store the invite (join) URL into a global for future use.
        global.e2e.joinUrl = await wait.andGetValue(driver, pom.campaigns.form.texters.joinUrl)
      }
      // Save
      await wait.andClick(driver, pom.campaigns.form.save)
      // This should switch to the Interactions section
      expect(await wait.andGetEl(driver, pom.campaigns.form.interactions.editorLaunch)).toBeDefined()
    })

    it('completes the Interactions section', async () => {
      // Script
      await wait.andClick(driver, pom.campaigns.form.interactions.editorLaunch)
      await wait.andClick(driver, pom.scriptEditor.editor)
      await wait.andType(driver, pom.scriptEditor.editor, campaign.interaction.script, { clear: false })
      await wait.andClick(driver, pom.scriptEditor.done)
      // Question
      await wait.andType(driver, pom.campaigns.form.interactions.questionText, campaign.interaction.question)
      // Save
      await wait.andClick(driver, pom.campaigns.form.interactions.submit)
      // This should switch to the Canned Responses section
      expect(await wait.andGetEl(driver, pom.campaigns.form.cannedResponse.addNew)).toBeDefined()
    })

    it('completes the Canned Responses section', async () => {
      // Add New
      await wait.andClick(driver, pom.campaigns.form.cannedResponse.addNew)
      // Title
      await wait.andType(driver, pom.campaigns.form.cannedResponse.title, campaign.cannedResponses[0].title)
      // Script
      await wait.andClick(driver, pom.campaigns.form.cannedResponse.editorLaunch)
      await wait.andClick(driver, pom.scriptEditor.editor)
      await wait.andType(driver, pom.scriptEditor.editor, campaign.interaction.script, { clear: false })
      await wait.andClick(driver, pom.scriptEditor.done)
      // Script - Relaunch and cancel (bug?)
      await driver.sleep(3000) // Transition
      await wait.andClick(driver, pom.campaigns.form.cannedResponse.editorLaunch)
      await driver.sleep(3000) // Transition
      await wait.andClick(driver, pom.scriptEditor.cancel)
      await driver.sleep(3000) // Transition
      // Submit Response
      await wait.andClick(driver, pom.campaigns.form.cannedResponse.submit)
      // Save
      await wait.andClick(driver, pom.campaigns.form.save)
      // Should be able to start campaign
      expect(await wait.andIsEnabled(driver, pom.campaigns.start)).toBeTruthy()
    })

    it('clicks Start Campaign', async () => {
      await wait.andClick(driver, pom.campaigns.start)
      // Validate Started
      expect(await wait.andGetEl(driver, pom.campaigns.isStarted)).toBeTruthy()
    })
  },
  editCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await wait.andClick(driver, pom.navigation.sections.campaigns)
    })

    it('clicks on an existing campaign', async () => {
      await wait.andClick(driver, pom.campaigns.campaignRowByText(campaign.basics.title))
    })

    it('clicks edit in Stats', async () => {
      await wait.andClick(driver, pom.campaigns.stats.edit)
    })

    it('changes the title in the Basics section', async () => {
      // Expand Basics section
      await wait.andClick(driver, pom.campaigns.form.basics.section)
      // Change Title
      await wait.andType(driver, pom.campaigns.form.basics.title, campaign.basics.title_changed, { click: true, clear: false })
      // Save
      await wait.andClick(driver, pom.campaigns.form.save)
    })

    it('reopens the Basics section to verify title', async () => {
      // Expand Basics section
      await wait.andClick(driver, pom.campaigns.form.basics.section)
      // Verify Title
      expect(await wait.andGetValue(driver, pom.campaigns.form.basics.title)).toBe(campaign.basics.title_changed)
    })
  }
}
