import { By } from 'selenium-webdriver'

export const texter = {
  sendFirstTexts: By.css('[data-test=sendFirstTexts]'),
  sendReplies: By.css('[data-test=sendReplies]'),
  send: By.css('[data-test=send]:not([disabled])'),
  replyByText(text) { return By.xpath(`//*[@data-test='messageList']/descendant::*[contains(text(),'${text}')]`) },
  emptyTodo: By.css('[data-test=empty]'),
  optOut: {
    button: By.css('[data-test=optOut]'),
    send: By.css('[type=submit]')
  }
}
