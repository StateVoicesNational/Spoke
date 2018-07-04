const { until } = require('selenium-webdriver')
// const config = require('./util/config')
import { selenium, wait } from './util/helpers'

// Page Objects
// const pom = require('./pom/login')
const pom = {}
pom.navigation = require('./page-objects/navigation')
pom.people = require('./page-objects/people')

// Strings for data entry
const strings = require('./data/strings')

// Reusable test functions
const login = require('./page-functions/login')
const invite = require('./page-functions/invite')
const campaigns = require('./page-functions/campaigns')

// Instantiate browser(s)
const driver = selenium.buildDriver()
const driverTexter = selenium.buildDriver()

describe('Basic text manager workflow', () => {
  beforeAll(() => {
    global.e2e = {}
  })
  afterAll(async () => {
    await selenium.quitDriver(driver)
    await selenium.quitDriver(driverTexter)
  })
  // Skip in CI tests, but useful for setting up existing admin
  xdescribe('Sign Up a new admin to Spoke', () => {
    login.signUp(driver, strings.admins.admin0)
  })

  describe('(As Admin) Log In an existing admin to Spoke', () => {
    login.tryLoginThenSignUp(driver, strings.admins.admin0)
  })

  describe('(As Admin) Create a New Organization / Team', () => {
    invite.createOrg(driver, strings.org)
  })

  describe('(As Admin) Invite a new User', () => {
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

  describe('(As Texter) Follow the Invite URL', () => {
    afterAll(async () => {
      await selenium.quitDriver(driverTexter)
    })

    describe('Create New Texter in Spoke', () => {
      login.tryLoginThenSignUp(driverTexter, strings.admins.texter0)
    })

    describe('should follow the link to the invite', async () => {
      it('should follow the link to the invite', async () => {
        console.log(`global: ${global.e2e.joinUrl}`)
        await driverTexter.get(global.e2e.joinUrl)
        await driverTexter.sleep(5000)
      })
    })
  })

  describe('(As Admin) Create a New Campaign', () => {
    campaigns.startCampaign(driver, strings.campaign)
  })
})
