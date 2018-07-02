const { By } = require('selenium-webdriver')

module.exports = {
  add: By.css('[data-test=addPerson]'),
  invite: {
    joinUrl: By.css('[data-test=joinUrl]'),
    ok: By.css('[data-test=inviteOk]')
  }
}
