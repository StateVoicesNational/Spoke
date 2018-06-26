// const { until } = require('selenium-webdriver')
// const config = require('./util/config')
const helpers = require('./util/helpers')
// const pom = require('./pom/login')
const strings = require('./data/strings')

const driver = helpers.selenium.buildDriver()
const login = require('./page-functions/login')
const invite = require('./page-functions/invite')

describe('Basic text manager workflow', () => {
  afterAll(async () => {
    await helpers.selenium.quitDriver(driver)
  })

  describe('Sign Up a new admin to Spoke', () => {
    login.signUp(driver, strings.admin)
  })
  // Skip in production tests, but useful for debugging?
  xdescribe('Log In an existing admin to Spoke', () => {
    login.logIn(driver, strings.admin)
  })

  describe('Create a New Organization / Team', () => {
    invite.createOrg(driver, strings.org)
  })
})
