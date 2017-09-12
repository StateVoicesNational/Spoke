const Twilio = require('twilio')
// import { r } from '../server/models'

/**
 * Get all numbers contacted in last 30 days.
 */
const getRecentContactNumbers = () => {
  // TODO: replace this with database call after thinky to knex switch
  return ['+17205555555', '+14145201377', '+14145348245']
}

/**
 * Get just the area code from a given number.
 */
const getAreaCodeForNumber = (number) => number.replace(/[^0-9]/g, '').substring(1, 4)

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
const getCurrentTwilioPoolNumbers = async (twilio, sid) => {
  // TODO: get numbers via API
  // const service = twilio.messaging
  //   .services(sid)
  //   .fetch()
  const service = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(['+14145201377', '+14145348245', '+15555555555', '+17201555555']);
    }, 500);
  });

  return service
}

/**
 * Drop any numbers with area codes not recently used.
 */
const getNumbersToDrop = (currentNumbers, recentAreaCodes) => {
  const currentAreaCodes = groupNumbersByAreaCode(currentNumbers)
  const dropAreaCodes = Object.keys(currentAreaCodes).filter((areaCode) => {
    return !(areaCode in recentAreaCodes)
  })
  return dropAreaCodes.reduce((numbers, areaCode) => {
    return [...numbers, ...currentAreaCodes[areaCode]]
  }, [])
}

/**
 * Get available numbers from Twilio API.
 */
const getAvailableTwilioNumbersByAreaCode = async (twilio, areaCode) => {
  const data = await twilio.availablePhoneNumbers('US').local
    .list({areaCode: areaCode})
  return data.availablePhoneNumbers.map(number => number.phone_number)
}

/**
 * Tell Twilio API to drop some numbers.
 */
const dropNumbersFromTwilioPool = (twilio, sid, numbersToDrop) => {
  // TODO: drop numbers via API
  console.log(numbersToDrop, 'numbersToDrop')
}

/**
 * Tell Twilio API to add some numbers.
 */
const addNumbersToTwilioPool = (twilio, sid, numbersToAdd) => {
  // TODO: add numbers via API
  console.log(numbersToAdd, 'numbersToAdd')
}

/**
 * Tell Twilio API to drop old numbers, add new numbers.
 */
const updateNumbersInTwilioPool = (twilio, sid, oldNumber, newNumber) => {
  dropNumbersFromTwilioPool(twilio, sid, [oldNumber])
  addNumbersToTwilioPool(twilio, sid, [newNumber])
}


const env = process.env
const sid = env.TWILIO_MESSAGING_SERVICE_SID
const twilio = Twilio(env.TWILIO_API_KEY, env.TWILIO_AUTH_TOKEN)
const recentAreaCodes = groupNumbersByAreaCode(getRecentContactNumbers())

getCurrentTwilioPoolNumbers(twilio, sid)
  .then((currentNumbers) => {
    const numbersToDrop = getNumbersToDrop(currentNumbers, recentAreaCodes)

    dropNumbersFromTwilioPool(twilio, sid, numbersToDrop)

    Object.keys(recentAreaCodes).map((areaCode) => {
      getAvailableTwilioNumbersByAreaCode(twilio, areaCode)
        .then((availableNumbers) => {
          if (availableNumbers.length) {
            updateNumbersInTwilioPool(twilio, sid, recentAreaCodes[areaCode][0], availableNumbers[0])
          }
        })
    })
  })
