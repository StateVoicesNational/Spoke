import { until } from 'selenium-webdriver'
import { wait } from '../util/helpers'
import config from '../util/config'
import pom from '../page-objects/index'

export const main = {
  createOrg(driver, name) {
    it('fills in the organization name', async () => {
      await wait.andType(driver, pom.main.organization.name, name)
    })

    it('clicks the submit button', async () => {
      await wait.andClick(driver, pom.main.organization.submit)
      await driver.wait(until.urlContains('admin'))
      const url = await driver.getCurrentUrl()
      const re = /\/admin\/(\d+)\//g
      global.e2e.organization = await re.exec(url)[1]
    })
  },
  editUser(driver, user) {
    it('opens the User menu', async () => {
      await wait.andClick(driver, pom.main.userMenuButton)
    })

    it('click on the user name', async () => {
      await wait.andClick(driver, pom.main.userMenuDisplayName)
    })

    it('changes user details', async () => {
      await wait.andType(driver, pom.people.edit.firstName, user.given_name_changed, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.lastName, user.family_name_changed, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.email, user.email_changed, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.cell, user.cell_changed, { click: true, clear: false })
      // Save
      await wait.andClick(driver, pom.people.edit.save)
      // Verify edits
      expect(await wait.andGetValue(driver, pom.people.edit.firstName)).toBe(user.given_name_changed)
      expect(await wait.andGetValue(driver, pom.people.edit.lastName)).toBe(user.family_name_changed)
      expect(await wait.andGetValue(driver, pom.people.edit.email)).toBe(user.email_changed)
    })

    it('reverts user details back to original settings', async () => {
      await wait.andType(driver, pom.people.edit.firstName, user.given_name, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.lastName, user.family_name, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.email, user.email, { click: true, clear: false })
      await wait.andType(driver, pom.people.edit.cell, user.cell, { click: true, clear: false })
      // Save
      await wait.andClick(driver, pom.people.edit.save)
      // Verify edits
      expect(await wait.andGetValue(driver, pom.people.edit.firstName)).toBe(user.given_name)
      expect(await wait.andGetValue(driver, pom.people.edit.lastName)).toBe(user.family_name)
      expect(await wait.andGetValue(driver, pom.people.edit.email)).toBe(user.email)
    })
  },
  logOutUser(driver) {
    it('gets the landing page', async () => {
      await driver.get(config.baseUrl)
    })

    it('opens the User menu', async () => {
      await wait.andClick(driver, pom.main.userMenuButton)
    })

    it('click on the user name', async () => {
      await wait.andClick(driver, pom.main.logOut)
    })
  }
}
