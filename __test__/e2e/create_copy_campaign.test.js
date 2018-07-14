import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main, people, texter } from './page-functions/index'

describe('Create and Copy Campaign', () => {
  // Instantiate browser(s)
  const driverAdmin = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Create and Copy Campaign - Admin' })
  const driverTexter = selenium.buildDriver({ name: 'Spoke E2E Tests - Chrome - Create and Copy Campaign - Texter' })
  const CAMPAIGN = STRINGS.campaigns.copyCampaign

  beforeAll(() => {
    global.e2e = {}
  })

  afterAll(async () => {
    await selenium.quitDriver(driverAdmin)
  })

  describe('(As Admin) Open Landing Page', () => {
    login.landing(driverAdmin)
  })

  describe('(As Admin) Log In an admin to Spoke', () => {
    login.tryLoginThenSignUp(driverAdmin, CAMPAIGN.admin)
  })

  describe('(As Admin) Create a New Organization / Team', () => {
    main.createOrg(driverAdmin, STRINGS.org)
  })

  describe('(As Admin) Invite a new User', () => {
    people.invite(driverAdmin)
  })

  describe('(As Texter) Follow the Invite URL', () => {
    texter.viewInvite(driverTexter)
    login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
  })

  describe('(As Texter) Close Browser', () => {
    it('closes browser', async () => {
      await selenium.quitDriver(driverTexter)
    })
  })

  describe('(As Admin) Create a New Campaign', () => {
    campaigns.startCampaign(driverAdmin, CAMPAIGN)
  })

  describe('(As Admin) Copy Campaign', () => {
    campaigns.copyCampaign(driverAdmin, CAMPAIGN)
  })
})
