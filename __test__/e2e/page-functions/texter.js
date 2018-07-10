import _ from 'lodash'
import { wait } from '../util/helpers'
import pom from '../page-objects/index'

export const texter = {
  sendTexts(driver, campaign) {
    it('refreshes Dashboard', async () => {
      await driver.navigate().refresh()
      await wait.andClick(driver, pom.texter.sendFirstTexts)
    })
    describe('works though the list of assigned contacts', () => {
      _.times(campaign.texters.contactLength, n => {
        it(`sends text ${n}`, async () => {
          await wait.andClick(driver, pom.texter.send)
        })
      })
      it('should have an empty todo list', async () => {
        await driver.sleep(1000)
        expect(await wait.andGetEl(driver, pom.texter.emptyTodo)).toBeDefined()
      })
    })
  }
}
