import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { campaigns, login, main } from './page-functions/index'

// Instantiate browser(s)
const driver = selenium.buildDriver()

describe('Basic text manager workflow', () => {
  const CAMPAIGN = STRINGS.campaigns.editCampaign
  beforeAll(() => {
    global.e2e = {}
  })
  afterAll(async () => {
    await selenium.quitDriver(driver)
  })

  describe('(As Admin) Log In an admin to Spoke', () => {
    login.tryLoginThenSignUp(driver, CAMPAIGN.admin)
  })

  describe('(As Admin) Create a New Organization / Team', () => {
    main.createOrg(driver, STRINGS.org)
  })

  describe('(As Admin) Create a New Campaign', () => {
    campaigns.startCampaign(driver, CAMPAIGN)
  })

  describe('(As Admin) Edit Campaign', () => {
    campaigns.editCampaign(driver, CAMPAIGN)
  })
})
