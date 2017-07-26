import Twilio from 'twilio'
// import { r } from '../server/models'

/**
 * Get all numbers contacted in last 30 days.
 */
const getRecentContactNumbers = () => {
  // TODO: replace this with database call after thinky to knex switch
  return ['+13037171543', '+14145201377', '+14145348245']
}

/**
 * Get just the area code from a given number.
 */
const getAreaCodeForNumber = (number) => number.replace(/[^0-9]/g, '').substring(0, 3)

/**
 * Put array of numbers in object keyed by area code.
 */
const groupNumbersByAreaCode = (numbers) => numbers.reduce((byAreaCode, number) => {
  const areaCode = getAreaCodeForNumber(number)
  if (!(areaCode in byAreaCode)) {
    byAreaCode[areaCode] = []
  }
  byAreaCode[areaCode].push(number)
  return byAreaCode
}, {})

/**
 * Get numbers for Twilio poool from API.
 */
const getCurrentTwilioPoolNumbers = (twilio, sid) => {
  const service = twilio.messaging
    .services(sid)
    .fetch()
  return service
}

/**
 * Drop any numbers with area codes not recently used.
 */
const getNumbersToDrop = (currentNumbers, recentAreaCodes) => {

}

/**
 * Get available numbers from Twilio API.
 */
const getAvailableTwilioNumbers = (twilio, sid) => {

}

/**
 * Determine which current numbers have a newer version in same area code.
 */
const getNumbersToUpdate = (currentNumbers, availableNumbers) => {

}

/**
 * Tell Twilio API to drop some numbers.
 */
const dropNumbersFromTwilioPool = (twilio, sid, numbersToDrop) => {

}

/**
 * Tell Twilio API to add some numbers.
 */
const addNumbersToTwilioPool = (twilio, sid, numbersToAdd) => {

}

/**
 * Tell Twilio API to drop old numbers, add new numbers.
 */
const updateNumbersInTwilioPool = (twilio, sid, numbersToUpdate) => {

}


const env = process.env
const sid = env.TWILIO_MESSAGING_SERVICE_SID
const twilio = Twilio(env.TWILIO_API_KEY, env.TWILIO_AUTH_TOKEN)
const recentAreaCodes = groupNumbersByAreaCode(getRecentContactNumbers())
const currentNumbers = getCurrentTwilioPoolNumbers(twilio, sid)
const numbersToDrop = getNumbersToDrop(currentNumbers, recentAreaCodes)
const availableNumbers = getAvailableTwilioNumbers(twilio, sid)
const numbersToUpdate = getNumbersToUpdate()

dropNumbersFromTwilioPool(twilio, sid, numbersToDrop)
updateNumbersInTwilioPool(twilio, sid, numbersToUpdate)

console.log(currentNumbers)
