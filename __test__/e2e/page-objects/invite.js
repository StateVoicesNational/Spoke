const { By } = require('selenium-webdriver')

module.exports = {
  organization: {
    name: By.css('[data-test=organization]'),
    submit: By.css('button[name="submit"]')
  }
}
