const { until } = require('selenium-webdriver')
// const config = require('./util/config')
import { selenium, wait } from './util/helpers'
const strings = require('./data/strings')
const pom = {}
pom.navigation = require('./page-objects/navigation')
pom.people = require('./page-objects/people')

const driver = selenium.buildDriver()
let driverTexter
const login = require('./page-functions/login')
const invite = require('./page-functions/invite')
// const campaigns = require('./page-functions/campaigns')

describe('Basic text manager workflow', () => {
  beforeAll(() => {
    global.e2e = {}
  })
  afterAll(async () => {
    await selenium.quitDriver(driver)
  })
  // Skip in CI tests, but useful for setting up existing admin
  xdescribe('Sign Up a new admin to Spoke', () => {
    login.signUp(driver, strings.admins.admin0)
  })

  xdescribe('Log In an existing admin to Spoke', () => {
    login.logIn(driver, strings.admins.admin0)
  })

  describe('Log In or Sign Up an admin to Spoke', () => {
    login.tryLoginThenSignUp(driver, strings.admins.admin0)
  })

  describe('Create a New Organization / Team', () => {
    invite.createOrg(driver, strings.org)
  })

  describe('Invite a new User', () => {
    it('opens the People tab', async () => {
      await wait.andClick(driver, pom.navigation.sections.people)
    })

    it('clicks on the + button to Invite a User', async () => {
      const el = await driver.wait(until.elementLocated(pom.people.add), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })

    it('views the invitation link', async () => {
      // Store Invite
      let el = await driver.wait(until.elementLocated(pom.people.invite.joinUrl), 10000)
      await driver.wait(until.elementIsVisible(el))
      global.e2e.joinUrl = await el.getAttribute('value')
      // OK
      el = await driver.wait(until.elementLocated(pom.people.invite.ok), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
    })
  })

  describe('Follow the Invite URL', () => {
    beforeAll(() => {
      driverTexter = selenium.buildDriver()
    })

    afterAll(async () => {
      await selenium.quitDriver(driverTexter)
    })

    it('should follow the link to the invite', async () => {
      await driverTexter.get(global.e2e.joinUrl)
      await driverTexter.sleep(5000)
    })
  })
})
