import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main, people, texter } from './page-functions/index'

jasmine.getEnv().addReporter(selenium.reporter)

describe('Basic Text Manager Workflow', () => {
  // Instantiate browser(s)
  const driverAdmin = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Basic Text Manager Workflow - Admin' })
  const driverTexter = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Basic Text Manager Workflow - Texter' })

  beforeAll(() => {
    global.e2e = {}
  })

  /**
   * Test Suite Sequence:
   * Setup Admin and Texter Users
   * Create Campaign (No Existing Texter)
   * Create Campaign (Existing Texter)
   * Create Campaign (No Existing Texter with Opt-Out)
   * Create Campaign (Existing Texter with Opt-Out)
   */

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

  describe('Create Campaign (No Existing Texter)', () => {
    const CAMPAIGN = STRINGS.campaigns.noExistingTexter

    describe('(As Admin) Create a New Campaign', () => {
      campaigns.startCampaign(driverAdmin, CAMPAIGN)
    })

    describe('(As Texter) Follow the Invite URL', () => {
      texter.viewInvite(driverTexter)
      login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
    })

    describe('(As Texter) Verify Todos', () => {
      texter.viewSendFirstTexts(driverTexter)
    })

    describe('(As Texter) Log Out', () => {
      main.logOutUser(driverTexter)
    })
  })

  describe('Create Campaign (Existing Texter)', () => {
    const CAMPAIGN = STRINGS.campaigns.existingTexter

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

    describe('(As Texter) Send Texts', () => {
      texter.sendTexts(driverTexter, CAMPAIGN)
    })

    describe('(As Admin) Send Replies', () => {
      campaigns.sendReplies(driverAdmin, CAMPAIGN)
    })

    describe('(As Texter) View Replies', () => {
      texter.viewReplies(driverTexter, CAMPAIGN)
    })

    describe('(As Texter) Opt Out Contact', () => {
      texter.optOutContact(driverTexter)
    })

    describe('(As Texter) Log Out', () => {
      main.logOutUser(driverTexter)
    })
  })

  describe('Create Campaign (No Existing Texter with Opt-Out)', () => {
    const CAMPAIGN = STRINGS.campaigns.noExistingTexterOptOut

    describe('(As Admin) Create a New Campaign', () => {
      campaigns.startCampaign(driverAdmin, CAMPAIGN)
    })

    describe('(As Texter) Follow the Invite URL', () => {
      texter.viewInvite(driverTexter)
      login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
    })

    describe('(As Texter) Verify Todos', () => {
      texter.viewSendFirstTexts(driverTexter)
    })

    describe('(As Texter) Log Out', () => {
      main.logOutUser(driverTexter)
    })
  })

  describe('Create Campaign (Existing Texters with Opt-Out)', () => {
    const CAMPAIGN = STRINGS.campaigns.existingTexterOptOut

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

    describe('(As Texter) Verify Todos', () => {
      texter.viewSendFirstTexts(driverTexter)
    })
  })
})
