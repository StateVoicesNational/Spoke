import { wait } from '../util/helpers'
import pom from '../page-objects/index'

export const people = {
  invite(driver) {
    it('opens the People tab', async () => {
      await wait.andClick(driver, pom.navigation.sections.people)
    })

    it('clicks on the + button to Invite a User', async () => {
      await wait.andClick(driver, pom.people.add)
    })

    it('views the invitation link', async () => {
      // Store Invite
      global.e2e.joinUrl = await wait.andGetValue(driver, pom.people.invite.joinUrl)
      // OK
      await wait.andClick(driver, pom.people.invite.ok)
    })
  }
}
