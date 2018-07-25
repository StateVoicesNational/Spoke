import _ from 'lodash'
import { wait, urlBuilder } from '../util/helpers'
import pom from '../page-objects/index'

export const texter = {
  sendTexts(driver, campaign) {
    it('refreshes Dashboard', async () => {
      await driver.get(urlBuilder.app.todos())
      await wait.andClick(driver, pom.texter.sendFirstTexts)
    })
    describe('works though the list of assigned contacts', () => {
      _.times(campaign.texters.contactLength, n => {
        it(`sends text ${n}`, async () => {
          await wait.andClick(driver, pom.texter.send)
        })
      })
      it('should have an empty todo list', async () => {
        await driver.get(urlBuilder.app.todos())
        expect(await wait.andGetEl(driver, pom.texter.emptyTodo)).toBeDefined()
      })
    })
  },
  optOutContact(driver) {
    it('clicks the Opt Out button', async () => {
      await wait.andClick(driver, pom.texter.optOut.button)
    })
    it('clicks Send', async () => {
      await wait.andClick(driver, pom.texter.optOut.send)
      await driver.sleep(3000)
    })
  },
  viewInvite(driver) {
    it('follows the link to the invite', async () => {
      await driver.get(global.e2e.joinUrl)
    })
  },
  viewReplies(driver, campaign) {
    it('refreshes Dashboard', async () => {
      await driver.get(urlBuilder.app.todos())
      await wait.andClick(driver, pom.texter.sendReplies)
    })
    it('verifies reply', async () => {
      expect(await wait.andGetEl(driver, pom.texter.replyByText(campaign.standardReply))).toBeDefined()
    })
  },
  viewSendFirstTexts(driver) {
    it('verifies that Send First Texts button is present', async () => {
      await driver.get(urlBuilder.app.todos())
      expect(await wait.andGetEl(driver, pom.texter.sendFirstTexts)).toBeDefined()
    })
  },
  checkSendTextsCount(driver) {
    it('TODO verifies that Send First Texts button is present', async () => {
      await driver.get(urlBuilder.app.todos())
      expect(await wait.andGetEl(driver, pom.texter.sendLater)).toBeDefined()
    })
  }
}
