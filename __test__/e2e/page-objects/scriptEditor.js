import { By } from 'selenium-webdriver'

export const scriptEditor = {
  editor: By.css('[data-testid=editorid]'),
  done: By.css('[data-test=scriptDone]'),
  cancel: By.css('[data-test=scriptCancel]')
}
