const { until } = require('selenium-webdriver')
const config = require('../util/config')
import { wait } from '../util/helpers'

// Place the page objects into a parent object
const pom = {}
pom.login = require('../page-objects/login')
// For legibility
const auth0 = pom.login.auth0

module.exports = {
  landing(driver) {
    it('gets the landing page', async () => {
      await driver.get(config.baseUrl)
    })

    it('clicks the login link', async () => {
      // Click on the login button
      wait.untilLocated(driver, pom.login.loginGetStarted, 30000)
      await driver.sleep(2000) // Wait for the transition, which is sometimes a problem.
      wait.andClick(driver, pom.login.loginGetStarted)

      // Wait until the Auth0 login page loads
      const loginUrl = `${config.baseUrl}/login`
      await driver.wait(until.urlContains(loginUrl))
      const url = await driver.getCurrentUrl()
      expect(url).toContain(loginUrl)
    })
  },
  signUp(driver, user) {
    it('gets the landing page', async () => {
      await driver.get(config.baseUrl)
    })

    it('clicks the login link', async () => {
      // Click on the login button
      wait.andClick(driver, pom.login.loginGetStarted)

      // Wait until the Auth0 login page loads
      const loginUrl = `${config.baseUrl}/login`
      await driver.wait(until.urlContains(loginUrl))
      const url = await driver.getCurrentUrl()
      expect(url).toContain(loginUrl)
    })

    it('opens the Sign Up tab', async () => {
      wait.andClick(driver, auth0.tabs.signIn, 20000)
    })

    it('fills in the new user details', async () => {
      let el
      el = await driver.wait(until.elementLocated(auth0.form.email))
      await driver.wait(until.elementIsVisible(el))
      await el.clear()
      await el.sendKeys(user.email)
      el = await driver.findElement(auth0.form.password)
      await el.clear()
      await el.sendKeys(user.password)
      el = await driver.findElement(auth0.form.given_name)
      await el.clear()
      await el.sendKeys(user.given_name)
      el = await driver.findElement(auth0.form.family_name)
      await el.clear()
      await el.sendKeys(user.family_name)
      el = await driver.findElement(auth0.form.cell)
      await el.clear()
      await el.sendKeys(user.cell)
    })

    it('accepts the user agreement', async () => {
      const el = await driver.findElement(auth0.form.agreement)
      await el.click()
    })

    it('clicks the submit button', async () => {
      const el = await driver.findElement(auth0.form.submit)
      await el.click()
    })

    it('authorizes Auth0 to access tenant', async () => {
      const el = await driver.wait(until.elementLocated(auth0.authorize.allow))
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })
  },
  logIn(driver, user) {
    this.landing(driver)

    it('opens the Log In tab', async () => {
      await wait.andClick(driver, auth0.tabs.logIn, 20000)
    })

    it('fills in the existing user details', async () => {
      await wait.andType(driver, auth0.form.email, user.email)
      await wait.andType(driver, auth0.form.password, user.password)
    })

    it('clicks the submit button', async () => {
      await wait.andClick(driver, auth0.form.submit)
    })
  }
}
