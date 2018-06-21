const { until } = require('selenium-webdriver')
const config = require('./util/config')
// const helpers = require('./util/helpers')
const pom = require('./pom/login')

module.exports = function (driver) {
  return {
    signIn(user) {
      it('gets the landing page', async () => {
        await driver.get(config.baseUrl)
      })

      it('clicks the login link', async () => {
        // Click on the login button
        const el = await driver.wait(until.elementLocated(pom.login, 10000))
        await driver.wait(until.elementIsVisible(el))
        await el.click()

        // Wait until the Auth0 login page loads
        const loginUrl = `${config.baseUrl}/login`
        await driver.wait(until.urlContains(loginUrl))
        const url = await driver.getCurrentUrl()
        expect(url).toContain(loginUrl)
      })

      it('opens the Sign Up tab', async () => {
        const el = await driver.wait(until.elementLocated(pom.auth0.tabs.signIn, 10000))
        await driver.wait(until.elementIsVisible(el))
        await el.click()
      })

      it('fills in the new user details', async () => {
        let el
        el = await driver.wait(until.elementLocated(pom.auth0.form.email))
        await driver.wait(until.elementIsVisible(el))
        await el.clear()
        await el.sendKeys(user.email)
        el = await driver.findElement(pom.auth0.form.password)
        await el.clear()
        await el.sendKeys(user.password)
        el = await driver.findElement(pom.auth0.form.given_name)
        await el.clear()
        await el.sendKeys(user.given_name)
        el = await driver.findElement(pom.auth0.form.family_name)
        await el.clear()
        await el.sendKeys(user.family_name)
        el = await driver.findElement(pom.auth0.form.cell)
        await el.clear()
        await el.sendKeys(user.cell)
        el = await driver.findElement(pom.auth0.form.agreement)
        await el.click()
        el = await driver.findElement(pom.auth0.form.submit)
        // await el.click()
      })
    }
  }
}
