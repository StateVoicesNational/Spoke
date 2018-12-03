import { until } from 'selenium-webdriver'
import config from '../util/config'
import { wait, urlBuilder } from '../util/helpers'
import pom from '../page-objects/index'

// For legibility
const auth0 = pom.login.auth0

export const login = {
  landing(driver) {
    it('gets the landing page', async () => {
      await driver.get(config.baseUrl)
    })

    it('clicks the login link', async () => {
      // Click on the login button
      wait.andClick(driver, pom.login.loginGetStarted, { msWait: 50000, waitAfterVisible: 2000 })

      // Wait until the Auth0 login page loads
      await driver.wait(until.urlContains(urlBuilder.login))
    })
  },
  signUpTab(driver, user) {
    let skip = false // Assume that these tests will proceed
    it('opens the Sign Up tab', async () => {
      skip = !!global.e2e[user.name].loginSucceeded // Skip tests if the login succeeded
      if (!skip) {
        wait.andClick(driver, auth0.tabs.signIn, { msWait: 20000 })
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
      if (!skip) await wait.andClick(driver, auth0.form.agreement)
    })

    it('clicks the submit button', async () => {
      if (!skip) await wait.andClick(driver, auth0.form.submit)
    })

    it('authorizes Auth0 to access tenant', async () => {
      if (!skip) await wait.andClick(driver, auth0.authorize.allow)
    })
  },
  signUp(driver, user) {
    this.landing(driver, user)
    this.signUpTab(driver, user)
  },
  logIn(driver, user) {
    it('opens the Log In tab', async () => {
      await wait.andClick(driver, auth0.tabs.logIn, { msWait: 50000 })
    })

    it('fills in the existing user details', async () => {
      await wait.andType(driver, auth0.form.email, user.email)
      await wait.andType(driver, auth0.form.password, user.password)
    })

    it('clicks the submit button', async () => {
      await wait.andClick(driver, auth0.form.submit, { waitAfterVisible: 1000 })
    })
  },
  tryLoginThenSignUp(driver, user) {
    this.logIn(driver, user)
    it('looks for an error', async () => {
      global.e2e[user.name] = {} // Set a global object for the user
      await driver.sleep(5000) // Wait for login attempt to return. Takes about 1 sec
      const errors = await driver.findElements(auth0.form.error)
      global.e2e[user.name].loginSucceeded = errors.length === 0
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
