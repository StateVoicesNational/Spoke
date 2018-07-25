import { By } from 'selenium-webdriver'

export const settings = {
  cardText: By.css('[data-test=settingsCardText]'),
  changeTextingHours: By.css('[data-test=changeTextingHours]'),
  enforceTextingHoursCheckbox: By.css('[data-test=textingHoursEnforced]'),
  textingHoursStart: By.css('[data-test=textingHoursStart]'),
  textingHoursEnd: By.css('[data-test=textingHoursEnd]'),
  hoursMenu: By.xpath("//div[@role='menu']"),
  hoursMenuItemByTest(text) { return By.xpath(`//span[@role='menuitem']/div/div/div[contains(text(),'${text}')]`) },
  save: By.css('button[type=submit]')
}
