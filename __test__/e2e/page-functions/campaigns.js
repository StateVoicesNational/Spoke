/**
 * Date Picker Notes:
 * The selector for the date is fragile. It may be better to programatically set it.
 * await driver.executeScript('document.getElementsByName("dueBy")[0].setAttribute("value","10 Jan 2019")')
 * Similarly, a sleep is added because it's difficult to know when the picker dialog is gone.
 */

import _ from 'lodash'
import { wait, urlBuilder } from '../util/helpers'
import pom from '../page-objects/index'

// For legibility
const form = pom.campaigns.form

export const campaigns = {
  startCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await driver.get(urlBuilder.admin.root())
      await wait.andClick(driver, pom.navigation.sections.campaigns)
    })

    it('clicks the + button to add a new campaign', async () => {
      await wait.andClick(driver, pom.campaigns.add)
    })

    it('completes the Basics section', async () => {
      // Title
      await wait.andClick(driver, form.basics.title)
      await wait.andType(driver, form.basics.title, campaign.basics.title)
      // Description
      await wait.andType(driver, form.basics.description, campaign.basics.description)
      // Select a Due Date using the Date Picker
      await wait.andClick(driver, form.basics.dueBy)
      await wait.andClick(driver, form.datePickerDialog.nextMonth)
      await driver.sleep(1000)
      await wait.andClick(driver, form.datePickerDialog.enabledDate)
      await driver.sleep(3000)
      // Save
      await wait.andClick(driver, form.save)
      // This should switch to the Contacts section
      expect(await wait.andGetEl(driver, form.contacts.uploadButton)).toBeDefined()
    })

    it('completes the Contacts section', async () => {
      await driver.sleep(3000)
      await wait.andType(driver, form.contacts.input, campaign.contacts.csv, { clear: false, elementIsVisible: false })
      expect(await wait.andGetEl(driver, form.contacts.uploadedContacts)).toBeDefined()
      // Save
      await wait.andClick(driver, form.save)
      // Reload the Contacts section to validate Contacts
      await driver.sleep(3000)
      await wait.andClick(driver, form.contacts.section)
      expect(await wait.andGetEl(driver, form.contacts.uploadedContacts)).toBeDefined()
      expect(await wait.andGetEl(driver, form.contacts.uploadedContactsByQty(campaign.texters.contactLength))).toBeDefined()
      await wait.andClick(driver, form.texters.section)
      // This should switch to the Texters section
      expect(await wait.andGetEl(driver, form.texters.addAll)).toBeDefined()
    })

    it('completes the Texters section', async () => {
      if (campaign.existingTexter) {
        // Add All
        await wait.andClick(driver, form.texters.addAll)
        // Assign (Split)
        await wait.andClick(driver, form.texters.autoSplit, { elementIsVisible: false })
        // Validate Assignment
        const assignedToFirstTexter = await wait.andGetValue(driver, form.texters.texterAssignmentByIndex(0))
        expect(Number(assignedToFirstTexter)).toBeGreaterThan(0)
        // Assign (All to Texter)
        await wait.andClick(driver, form.texters.autoSplit, { elementIsVisible: false })
        await wait.andType(driver, form.texters.texterAssignmentByText(campaign.texter.given_name), campaign.texters.contactLength)
        // Validate Assignment
        expect(await wait.andGetValue(driver, form.texters.texterAssignmentByText(campaign.admin.given_name))).toBe('0')
      } else {
        // Dynamically Assign
        await wait.andClick(driver, form.texters.useDynamicAssignment, { elementIsVisible: false })
        // Store the invite (join) URL into a global for future use.
        global.e2e.joinUrl = await wait.andGetValue(driver, form.texters.joinUrl)
      }
      // Save
      await wait.andClick(driver, form.save)
      // This should switch to the Interactions section
      expect(await wait.andGetEl(driver, form.interactions.editorLaunch)).toBeDefined()
    })

    describe('completes the Interactions section', async () => {
      it('adds an initial question', async () => {
        // Script
        await wait.andClick(driver, form.interactions.editorLaunch)
        await wait.andClick(driver, pom.scriptEditor.editor)
        await wait.andType(driver, pom.scriptEditor.editor, campaign.interaction.script, { clear: false })
        await wait.andClick(driver, pom.scriptEditor.done)
        // Question
        await wait.andType(driver, form.interactions.questionText, campaign.interaction.question)
        // Save with No Answers Defined
        await wait.andClick(driver, form.interactions.submit)
        await wait.andClick(driver, form.interactions.section)
        let allChildInteractions = await driver.findElements(form.interactions.childInteraction)
        expect(allChildInteractions.length).toBe(0)
        // Save with Empty Answer
        await wait.andClick(driver, form.interactions.addResponse)
        await wait.andClick(driver, form.interactions.submit)
        await wait.andClick(driver, form.interactions.section)
        allChildInteractions = await driver.findElements(form.interactions.childInteraction)
        expect(allChildInteractions.length).toBe(1)
      })

      describe('Add all Responses', () => {
        _.each(campaign.interaction.answers, (answer, index) => {
          it(`Adds Answer ${index}`, async () => {
            if (index > 0) await wait.andClick(driver, form.interactions.addResponse) // The first (0th) response reuses the empty Answer created above
            // Answer
            await wait.andType(driver, form.interactions.answerOptionChildByIndex(index), answer.answerOption, { clear: false })
            // Answer Script
            await wait.andClick(driver, form.interactions.editorLaunchChildByIndex(index))
            await wait.andClick(driver, pom.scriptEditor.editor)
            await wait.andType(driver, pom.scriptEditor.editor, answer.script, { clear: false })
            await wait.andClick(driver, pom.scriptEditor.done)
            // Answer - Next Question
            await wait.andType(driver, form.interactions.questionTextChildByIndex(index), answer.questionText, { clear: false })
          })
        })
        it('validates that all responses were added', async () => {
          const allChildInteractions = await driver.findElements(form.interactions.childInteraction)
          expect(allChildInteractions.length).toBe(campaign.interaction.answers.length)
        })
      })

      it('saves for the last time', async () => {
        // Save
        await wait.andClick(driver, form.interactions.submit)
        // This should switch to the Canned Responses section
        expect(await wait.andGetEl(driver, form.cannedResponse.addNew)).toBeDefined()
      })
    })

    it('completes the Canned Responses section', async () => {
      // Add New
      await wait.andClick(driver, form.cannedResponse.addNew)
      // Title
      await wait.andType(driver, form.cannedResponse.title, campaign.cannedResponses[0].title)
      // Script
      await wait.andClick(driver, form.cannedResponse.editorLaunch)
      await wait.andClick(driver, pom.scriptEditor.editor)
      await wait.andType(driver, pom.scriptEditor.editor, campaign.cannedResponses[0].script, { clear: false })
      await wait.andClick(driver, pom.scriptEditor.done)
      // Script - Relaunch and cancel (bug?)
      await driver.sleep(3000) // Transition
      await wait.andClick(driver, form.cannedResponse.editorLaunch)
      await driver.sleep(3000) // Transition
      await wait.andClick(driver, pom.scriptEditor.cancel)
      await driver.sleep(3000) // Transition
      // Submit Response
      await wait.andClick(driver, form.cannedResponse.submit)
      // Save
      await wait.andClick(driver, form.save)
      // Should be able to start campaign
      expect(await wait.andIsEnabled(driver, pom.campaigns.start)).toBeTruthy()
    })

    it('clicks Start Campaign', async () => {
      // Store the new campaign URL into a global for future use.
      global.e2e.newCampaignUrl = await driver.getCurrentUrl()
      await wait.andClick(driver, pom.campaigns.start)
      // Validate Started
      expect(await wait.andGetEl(driver, pom.campaigns.isStarted)).toBeTruthy()
    })
  },
  copyCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await driver.get(urlBuilder.admin.root())
      await wait.andClick(driver, pom.navigation.sections.campaigns)
    })

    it('clicks on an existing campaign', async () => {
      await wait.andClick(driver, pom.campaigns.campaignRowByText(campaign.basics.title))
    })

    it('clicks Copy in Stats', async () => {
      await wait.andClick(driver, pom.campaigns.stats.copy)
    })

    it('verifies copy in Campaigns list', async () => {
      await wait.andClick(driver, pom.navigation.sections.campaigns)
      expect(await wait.andGetEl(driver, pom.campaigns.campaignRowByText('COPY'))).toBeDefined()
      expect(await wait.andGetEl(driver, pom.campaigns.warningIcon)).toBeDefined()
      await wait.andClick(driver, pom.campaigns.campaignRowByText('COPY'))
    })

    describe('verifies Campaign sections', () => {
      it('verifies Basics section', async () => {
        await wait.andClick(driver, form.basics.section)
        expect(await wait.andGetValue(driver, form.basics.title)).toBe(campaign.basics.title_copied)
        expect(await wait.andGetValue(driver, form.basics.description)).toBe(campaign.basics.description)
        expect(await wait.andGetValue(driver, form.basics.dueBy)).toBe('')
      })
      it('verifies Contacts section', async () => {
        await wait.andClick(driver, form.contacts.section)
        const uploadedContacts = await driver.findElements(form.contacts.uploadedContacts)
        expect(uploadedContacts.length > 0).toBeFalsy()
      })
      it('verifies Texters section', async () => {
        await wait.andClick(driver, form.texters.section)
        const assignedContacts = await driver.findElements(form.texters.texterAssignmentByText(campaign.texter.given_name))
        expect(assignedContacts.length > 0).toBeFalsy()
      })
      it('verifies Interactions section', async () => {
        await wait.andClick(driver, form.interactions.section)
        expect(await wait.andGetValue(driver, form.interactions.editorLaunch)).toBe(campaign.interaction.script)
        expect(await wait.andGetValue(driver, form.interactions.questionText)).toBe(campaign.interaction.question)
      })
      it('verifies Canned Responses section', async () => {
        await wait.andClick(driver, form.cannedResponse.section)
        expect(await wait.andGetEl(driver, form.cannedResponse.createdResponseByText(campaign.cannedResponses[0].title))).toBeDefined()
        expect(await wait.andGetEl(driver, form.cannedResponse.createdResponseByText(campaign.cannedResponses[0].script))).toBeDefined()
      })
    })
  },
  editCampaign(driver, campaign) {
    it('opens the Campaigns tab', async () => {
      await driver.get(urlBuilder.admin.root())
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
      await wait.andClick(driver, form.basics.section)
      // Change Title
      await wait.andType(driver, form.basics.title, campaign.basics.title_changed, { click: true, clear: false })
      // Save
      await wait.andClick(driver, form.save)
    })

    it('reopens the Basics section to verify title', async () => {
      // Expand Basics section
      await wait.andClick(driver, form.basics.section)
      // Verify Title
      expect(await wait.andGetValue(driver, form.basics.title)).toBe(campaign.basics.title_changed)
    })
  },
  sendReplies(driver, campaign) {
    it('sends Replies', async () => {
      const sendRepliesUrl = global.e2e.newCampaignUrl.substring(0, global.e2e.newCampaignUrl.indexOf('edit?new=true')) + 'send-replies'
      await driver.get(sendRepliesUrl)
    })
    describe('simulates the assigned contacts sending replies', () => {
      _.times(campaign.texters.contactLength, n => {
        it(`sends reply ${n}`, async () => {
          await wait.andType(driver, pom.campaigns.replyByIndex(n), campaign.standardReply)
          await wait.andClick(driver, pom.campaigns.sendByIndex(n))
        })
      })
    })
  }
}
