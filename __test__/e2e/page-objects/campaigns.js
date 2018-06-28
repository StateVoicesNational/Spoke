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
    contacts: {
      uploadButton: By.css('[data-test=uploadButton]'),
      input: By.css('#contact-upload')
    },
    submit: By.css('[type=submit]')
  }
}
