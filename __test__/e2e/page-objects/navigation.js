import { By } from 'selenium-webdriver'

export const navigation = {
  sections: {
    campaigns: By.css('[data-test=navCampaigns]'),
    people: By.css('[data-test=navPeople]'),
    optouts: By.css('[data-test=navOptouts]'),
    messageReview: By.css('[data-test=navIncoming]'),
    settings: By.css('[data-test=navSettings]'),
    switchToTexter: By.css('[data-test=navSwitchToTexter]')
  }
}
