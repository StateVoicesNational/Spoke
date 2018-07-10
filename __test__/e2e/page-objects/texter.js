import { By } from 'selenium-webdriver'

export const texter = {
  sendFirstTexts: By.css('[data-test=sendFirstTexts]'),
  send: By.css('[data-test=send]:not([disabled])'),
  emptyTodo: By.css('[data-test=empty]')
}
