import { selenium } from './util/helpers'
import STRINGS from './data/strings'
import { login, main, people } from './page-functions/index'

describe('Invite Texter workflow', () => {
  // Instantiate browser(s)
  const driverAdmin = selenium.buildDriver()
  const driverTexter = selenium.buildDriver()
  const CAMPAIGN = STRINGS.campaigns.userManagement

  beforeAll(() => {
    global.e2e = {}
  })

  afterAll(async () => {
    await selenium.quitDriver(driverAdmin)
    await selenium.quitDriver(driverTexter)
  })

  describe('(As Admin) Open Landing Page', () => {
    login.landing(driver)
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
    describe('should follow the link to the invite', async () => {
      it('should follow the link to the invite', async () => {
        await driverTexter.get(global.e2e.joinUrl)
      })
      login.tryLoginThenSignUp(driverTexter, CAMPAIGN.texter)
    })
  })
  describe('(As Admin) Edit User', () => {
    people.editUser(driverAdmin, CAMPAIGN.admin)
  })

  describe('(As Texter) Edit User', () => {
    main.editUser(driverTexter, CAMPAIGN.texter)
  })
})
