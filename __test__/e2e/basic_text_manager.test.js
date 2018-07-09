import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main, people } from './page-functions/index'

// Instantiate browser(s)
const driver = selenium.buildDriver()
const driverTexter = selenium.buildDriver()

describe('Basic text manager workflow', () => {
  const CAMPAIGN = STRINGS.campaigns.existingTexter
  beforeAll(() => {
    global.e2e = {}
  })
  afterAll(async () => {
    await selenium.quitDriver(driver)
    await selenium.quitDriver(driverTexter)
  })

  describe('(As Admin) Log In an admin to Spoke', () => {
    login.tryLoginThenSignUp(driver, CAMPAIGN.admin)
  })

  describe('(As Admin) Create a New Organization / Team', () => {
    main.createOrg(driver, STRINGS.org)
  })

  describe('(As Admin) Invite a new User', () => {
    people.invite(driver)
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
    campaigns.startCampaign(driver, CAMPAIGN)
  })
})
