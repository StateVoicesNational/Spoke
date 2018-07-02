const { until } = require('selenium-webdriver')
// const config = require('./util/config')
const helpers = require('./util/helpers')
const strings = require('./data/strings')
const pom = {}
pom.navigation = require('./page-objects/navigation')
pom.people = require('./page-objects/people')

const driver = helpers.selenium.buildDriver()
let driverTexter
const login = require('./page-functions/login')
const invite = require('./page-functions/invite')
// const campaigns = require('./page-functions/campaigns')

describe('Basic text manager workflow', () => {
  beforeAll(() => {
    global.e2e = {}
  })
  afterAll(async () => {
    await helpers.selenium.quitDriver(driver)
  })
  // Skip in CI tests, but useful for setting up existing admin
  xdescribe('Sign Up a new admin to Spoke', () => {
    login.signUp(driver, strings.admin)
  })

  describe('Log In an existing admin to Spoke', () => {
    login.logIn(driver, strings.admin)
  })

  describe('Create a New Organization / Team', () => {
    invite.createOrg(driver, strings.org)
  })

  describe('Invite a new User', () => {
    it('opens the People tab', async () => {
      const el = await driver.wait(until.elementLocated(pom.navigation.sections.people), 10000)
      await driver.wait(until.elementIsVisible(el))
      await el.click()
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
      driverTexter = helpers.selenium.buildDriver()
    })

    afterAll(async () => {
      await helpers.selenium.quitDriver(driverTexter)
    })

    it('should follow the link to the invite', async () => {
      await driver.get(global.e2e.joinUrl)
      await driver.sleep(5000)
    })
  })
})
