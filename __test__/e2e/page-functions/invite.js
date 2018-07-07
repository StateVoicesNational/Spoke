import { wait } from '../util/helpers'
import pom from '../page-objects/index'

export const invite = {
  createOrg(driver, name) {
    it('fills in the organization name', async () => {
      await wait.andType(driver, pom.invite.organization.name, name)
    })

    it('clicks the submit button', async () => {
      await wait.andClick(driver, pom.invite.organization.submit)
    })
  }
}
