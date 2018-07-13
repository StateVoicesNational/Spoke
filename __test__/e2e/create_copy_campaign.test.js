import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main, people } from './page-functions/index'

describe('Create and Copy Campaign', () => {
  // Instantiate browser(s)
  const driverAdmin = selenium.buildDriver()
  const driverTexter = selenium.buildDriver()
  const CAMPAIGN = STRINGS.campaigns.copyCampaign

  beforeAll(() => {
    global.e2e = {}
  })

  afterAll(async () => {
    await selenium.quitDriver(driverAdmin)
    await selenium.quitDriver(driverTexter)
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
    describe('Create New Texter in Spoke', () => {
      login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
    })

    describe('should follow the link to the invite', async () => {
      it('should follow the link to the invite', async () => {
        await driverTexter.get(global.e2e.joinUrl)
      })
    })
  })

  describe('(As Admin) Create a New Campaign', () => {
    campaigns.startCampaign(driverAdmin, CAMPAIGN)
  })

  describe('(As Admin) Copy Campaign', () => {
    campaigns.copyCampaign(driverAdmin, CAMPAIGN)
  })
})
