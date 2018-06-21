const { until } = require('selenium-webdriver')
const config = require('./util/config')
const helpers = require('./util/helpers')
const pom = require('./pom/login')
const strings = require('./data/strings')

const driver = helpers.selenium.buildDriver()
const login = require('./login')(driver)

describe('Basic text manager workflow', () => {
  afterAll(async () => {
    await helpers.selenium.quitDriver(driver)
  })

  describe('Signing up a new user to Spoke', () => {
    login.signIn(strings.admin)
  })
})
