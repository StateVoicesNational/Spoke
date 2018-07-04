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
  signUpTab(driver, user) {
    let skip = false // Assume that these tests will proceed
    it('opens the Sign Up tab', async () => {
      skip = !!global.e2e[user.name].loginSucceeded // Skip tests if the login succeeded
      // console.log(`skip: ${skip}`)
      if (!skip) {
        wait.andClick(driver, auth0.tabs.signIn, 20000)
      }
    })

    it('fills in the new user details', async () => {
      if (!skip) {
        await driver.sleep(3000) // Allow time for the client to populate the email
        await wait.andType(driver, auth0.form.email, user.email)
        await wait.andType(driver, auth0.form.password, user.password)
        await wait.andType(driver, auth0.form.given_name, user.given_name)
        await wait.andType(driver, auth0.form.family_name, user.family_name)
        await wait.andType(driver, auth0.form.cell, user.cell)
      }
    })

    it('accepts the user agreement', async () => {
      if (!skip) {
        const el = await driver.findElement(auth0.form.agreement)
        await el.click()
      }
    })

    it('clicks the submit button', async () => {
      if (!skip) {
        const el = await driver.findElement(auth0.form.submit)
        await el.click()
      }
    })

    it('authorizes Auth0 to access tenant', async () => {
      if (!skip) {
        const el = await driver.wait(until.elementLocated(auth0.authorize.allow))
        await driver.wait(until.elementIsVisible(el))
        await el.click()
      }
    })
  },
  signUp(driver, user) {
    this.landing(driver, user)
    this.signUpTab(driver, user)
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
  },
  tryLoginThenSignUp(driver, user) {
    this.logIn(driver, user)
    it('looks for an error', async () => {
      global.e2e[user.name] = {} // Set a global object for the user
      await driver.sleep(5000) // Wait for login attempt to return. Takes about 1 sec
      const errors = await driver.findElements(auth0.form.error)
      global.e2e[user.name].loginSucceeded = errors.length === 0
      // console.log(`errors.length=${errors.length}`)
    })
    describe('Sign Up if Login Fails', () => {
      /**
       * Note
       * This always runs, as the test suite is defined before any tests run
       * However, all tests will skip if global.e2e[user.name].loginSucceeded
       */
      this.signUpTab(driver, user)
    })
  }
}
