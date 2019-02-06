import { By } from 'selenium-webdriver'

export const people = {
  add: By.css('[data-test=addPerson]'),
  invite: {
    joinUrl: By.css('[data-test=joinUrl]'),
    ok: By.css('[data-test=inviteOk]')
  },
  getRowByName(name) { return By.xpath(`//td[contains(text(),'${name}')]/ancestor::tr`) },
  editButtonByName(name) { return By.xpath(`//td[contains(text(),'${name}')]/ancestor::tr/descendant::button[@data-test='editPerson']`) },
  edit: {
    editButton: By.css('[data-test=editPerson]'),
    firstName: By.css('[data-test=firstName]'),
    lastName: By.css('[data-test=lastName]'),
    email: By.css('[data-test=email]'),
    cell: By.css('[data-test=cell]'),
    save: By.css('[type=submit]')
  }
}
