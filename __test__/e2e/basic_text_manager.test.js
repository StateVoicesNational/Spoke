// const { until } = require('selenium-webdriver')
// const config = require('./util/config')
const helpers = require('./util/helpers')
// const pom = require('./pom/login')
const strings = require('./data/strings')

const driver = helpers.selenium.buildDriver()
const login = require('./page-functions/login')
const invite = require('./page-functions/invite')
const campaigns = require('./page-functions/campaigns')

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

  // TODO : Invite a new texter

  describe('Create a New Campaign', () => {
    campaigns.startCampaign(driver, strings.campaign)
  })
})
