import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'

export const getFormattedPhoneNumber = (cell) => {
  const phoneUtil = PhoneNumberUtil.getInstance()

  try {
    const inputNumber = phoneUtil.parse(cell, 'US')
    const isValid = phoneUtil.isValidNumber(inputNumber)
    if (isValid) {
      return phoneUtil.format(inputNumber, PhoneNumberFormat.E164)
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
    return null
  }
}
