import { By } from 'selenium-webdriver'

export const campaigns = {
  add: By.css('[data-test=addCampaign]'),
  start: By.css('[data-test=startCampaign]:not([disabled])'),
  campaignRowByText(text) { return By.xpath(`//*[contains(text(),'${text}')]/ancestor::*[@data-test='campaignRow']`) },
  warningIcon: By.css('[data-test=warningIcon]'),
  form: {
    basics: {
      section: By.css('[data-test=basics]'),
      title: By.css('[data-test=title]'),
      description: By.css('[data-test=description]'),
      dueBy: By.css('[data-test=dueBy]')
    },
    datePickerDialog: {
      // This selector is fragile and alternate means of finding an enabled date should be investigated.
      nextMonth: By.css('body > div:nth-child(5) > div > div:nth-child(1) > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > button:nth-child(3)'),
      enabledDate: By.css('body > div:nth-child(5) > div > div:nth-child(1) > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > div > div button[tabindex="0"]')
    },
    contacts: {
      section: By.css('[data-test=contacts]'),
      uploadButton: By.css('[data-test=uploadButton]'),
      input: By.css('#contact-upload'),
      uploadedContacts: By.css('[data-test=uploadedContacts]')
    },
    texters: {
      section: By.css('[data-test=texters]'),
      useDynamicAssignment: By.css('[data-test=useDynamicAssignment]'),
      joinUrl: By.css('[data-test=joinUrl]'),
      addAll: By.css('[data-test=addAll]'),
      autoSplit: By.css('[data-test=autoSplit]'),
      texterAssignmentByIndex(index) { return By.css(`[data-test=texter${index}Assignment]`) },
      texterNameByIndex(index) { return By.css(`[data-test=texter${index}Name]`) }
    },
    interactions: {
      section: By.css('[data-test=interactions]'),
      questionText: By.css('[data-test=questionText]'),
      editorLaunch: By.css('[data-test=editorInteraction]'),
      submit: By.css('[data-test=interactionSubmit]')
    },
    cannedResponse: {
      section: By.css('[data-test=cannedResponses]'),
      addNew: By.css('[data-test=newCannedResponse]'),
      title: By.css('[data-test=title]'),
      editorLaunch: By.css('[data-test=editorResponse]'),
      createdResponseByText(text) { return By.xpath(`//span[@data-test='cannedResponse']/descendant::*[contains(text(),'${text}')]`) },
      submit: By.css('[data-test=addResponse]')
    },
    save: By.css('[type=submit]:not([disabled]')
  },
  stats: {
    copy: By.css('[data-test=copyCampaign]'),
    edit: By.css('[data-test=editCampaign]')
  },
  isStarted: By.css('[data-test=campaignIsStarted]')
}
