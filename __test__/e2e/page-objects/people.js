import { By } from 'selenium-webdriver'

export const people = {
  add: By.css('[data-test=addPerson]'),
  invite: {
    joinUrl: By.css('[data-test=joinUrl]'),
    ok: By.css('[data-test=inviteOk]')
  }
}
