import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
import { log } from './log'

export const getFormattedPhoneNumber = (cell, country = 'US') => {
  const phoneUtil = PhoneNumberUtil.getInstance()

  try {
    const inputNumber = phoneUtil.parse(cell, country || 'US')
    const isValid = phoneUtil.isValidNumber(inputNumber)
    if (isValid) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164)
    }
    return null
  } catch (e) {
    log.error(e)
    return null
  }
}

export const getDisplayPhoneNumber = (e164Number, country = 'US') => {
  const phoneUtil = PhoneNumberUtil.getInstance()
  const parsed = phoneUtil.parse(e164Number, country)
  return phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL)
}
