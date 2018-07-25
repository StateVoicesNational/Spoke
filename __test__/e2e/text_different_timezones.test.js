import { selenium, getTextingHoursRange } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main, people, settings, texter } from './page-functions/index'

jasmine.getEnv().addReporter(selenium.reporter)

describe('Text Contacts in Different Timezones', () => {
  // Instantiate browser(s)
  const driverAdmin = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Text Contacts in Different Timezones - Admin' })
  const driverTexter = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Text Contacts in Different Timezones - Texter' })
  const CAMPAIGN = STRINGS.campaigns.timezone

  const textingHoursFormatted = getTextingHoursRange()

  beforeAll(() => {
    global.e2e = {}
  })

  afterAll(async () => {
    await selenium.quitDriver(driverAdmin)
    await selenium.quitDriver(driverTexter)
  })

  describe('Setup Admin and Texter Users', () => {
    describe('(As Admin) Open Landing Page', () => {
      login.landing(driverAdmin)
    })

    describe('(As Admin) Log In an admin to Spoke', () => {
      login.tryLoginThenSignUp(driverAdmin, STRINGS.users.admin0)
    })

    describe('(As Admin) Create a New Organization / Team', () => {
      main.createOrg(driverAdmin, STRINGS.org)
    })
  })

  describe('(As Admin) Set the Timezone', () => {
    settings.enforceTextingHours(driverAdmin, textingHoursFormatted.start, textingHoursFormatted.end)
  })

  describe('(As Admin) Invite a new Texter', () => {
    people.invite(driverAdmin)
  })

  describe('(As Texter) Follow the Invite URL', () => {
    texter.viewInvite(driverTexter)
    login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
  })

  describe('(As Admin) Create a New Campaign', () => {
    campaigns.startCampaign(driverAdmin, CAMPAIGN)
  })

  describe('(As Texter) Check Send Later', () => {
    texter.checkSendTextsCount(driverTexter, CAMPAIGN)
  })

  // TODO: Disable Enforce Texting Hours and check Send Later again
})
