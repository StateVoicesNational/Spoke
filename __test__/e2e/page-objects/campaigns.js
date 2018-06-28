const { By } = require('selenium-webdriver')

module.exports = {
  add: By.css('[data-test=add-campaign]'),
  form: {
    basics: {
      // TODO: These have 'name' attributes
      title: By.css('[data-test=title]'),
      description: By.css('[data-test=description]'),
      dueBy: By.css('[data-test=dueBy]'),
      introHtml: By.css('[data-test=introHtml]'),
      logoImageUrl: By.css('[data-test=logoImageUrl]'),
      primaryColor: By.css('[data-test=primaryColor]')
    },
    datePickerDialog: {
      // TODO: This selector is fragile and alternate means of finding an enabled date should be investigated.
      enabledDate: By.css('body > div:nth-child(5) > div > div:nth-child(1) > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(3) > div > div button[tabindex="0"]')
    },
    contacts: {
      uploadButton: By.css('[data-test=uploadButton]'),
      input: By.css('#contact-upload')
    },
    save: By.css('[type=submit]')
  }
}
