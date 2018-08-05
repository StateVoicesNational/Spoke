import { By } from 'selenium-webdriver'

export const login = {
  auth0: {
    tabs: {
      logIn: By.css('.auth0-lock-tabs>li:nth-child(1)'),
      signIn: By.css('.auth0-lock-tabs>li:nth-child(2)')
    },
    form: {
      email: By.css('div.auth0-lock-input-email > div > input'),
      password: By.css('div.auth0-lock-input-password > div > input'),
      given_name: By.css('div.auth0-lock-input-given_name > div > input'),
      family_name: By.css('div.auth0-lock-input-family_name > div > input'),
      cell: By.css('div.auth0-lock-input-cell > div > input'),
      agreement: By.css('span.auth0-lock-sign-up-terms-agreement > label > input'), // Checkbox
      submit: By.css('button.auth0-lock-submit'),
      error: By.css('div.auth0-global-message-error')
    },
    authorize: {
      allow: By.css('#allow')
    }
  },
  loginGetStarted: By.css('#login')
}
