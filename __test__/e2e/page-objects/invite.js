import { By } from 'selenium-webdriver'

export const invite = {
  organization: {
    name: By.css('[data-test=organization]'),
    submit: By.css('button[name="submit"]')
  }
}
