const { By } = require('selenium-webdriver')

module.exports = {
  organization: {
    name: By.css('#organization'),
    submit: By.css('button[name="submit"]')
  }
}
