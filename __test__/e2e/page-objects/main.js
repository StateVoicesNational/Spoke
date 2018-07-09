import { By } from 'selenium-webdriver'

export const main = {
  organization: {
    name: By.css('[data-test=organization]'),
    submit: By.css('button[name="submit"]')
  },
  userMenuButton: By.css('[data-test=userMenuButton]'),
  userMenuDisplayName: By.css('[data-test=userMenuDisplayName]'),
  edit: {
    editButton: By.css('[data-test=editPerson]'),
    firstName: By.css('[data-test=firstName]'),
    lastName: By.css('[data-test=lastName]'),
    email: By.css('[data-test=email]'),
    cell: By.css('[data-test=cell]'),
    save: By.css('[type=submit]')
  },
  home: By.css('[data-test=home]')
}
