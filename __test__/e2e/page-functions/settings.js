import { wait, urlBuilder } from '../util/helpers'
import pom from '../page-objects/index'

export const settings = {
  enforceTextingHours(driver, hourStart, hourEnd) {
    it('opens the Settings tab', async () => {
      await driver.get(urlBuilder.admin.root())
      await wait.andClick(driver, pom.navigation.sections.settings)
      await wait.untilLocated(driver, pom.settings.cardText)
    })
    it('enables texting hours', async () => {
      // Toggle if Checkbox is "unchecked"
      const enforceTextingHoursCheckbox = await wait.andGetEl(driver, pom.settings.enforceTextingHoursCheckbox, { elementIsVisible: false, waitAfterVisible: 2000 })
      const enforceTextingHoursState = await enforceTextingHoursCheckbox.getAttribute('data-toggled')
      if (enforceTextingHoursState === 'false') { await wait.andClick(driver, pom.settings.enforceTextingHoursCheckbox, { elementIsVisible: false }) }
      // Validation
      expect(await wait.andGetEl(driver, pom.settings.changeTextingHours)).toBeTruthy()
      expect(await enforceTextingHoursCheckbox.getAttribute('data-toggled') === 'true').toBeTruthy()
    })
    it('clicks on Change Texting Hours', async () => {
      await wait.andClick(driver, pom.settings.changeTextingHours)
    })
    it('changes Start Time', async () => {
      await wait.andClick(driver, pom.settings.textingHoursStart, { waitAfterVisible: 2000 })
      expect(await wait.andGetEl(driver, pom.settings.hoursMenu)).toBeTruthy()
      await wait.andClick(driver, pom.settings.hoursMenuItemByTest(hourStart), { waitAfterVisible: 2000 })
    })
    it('changes End Time', async () => {
      await wait.andClick(driver, pom.settings.textingHoursEnd, { waitAfterVisible: 2000 })
      expect(await wait.andGetEl(driver, pom.settings.hoursMenu)).toBeTruthy()
      await wait.andClick(driver, pom.settings.hoursMenuItemByTest(hourEnd), { waitAfterVisible: 2000 })
    })
    it('clicks Save', async () => {
      await wait.andClick(driver, pom.settings.save, { goesStale: true, waitAfterVisible: 2000 })
    })
  }
}
