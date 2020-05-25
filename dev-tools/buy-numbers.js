const parseArgs = require("minimist");
const twilio = require("twilio")(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_AUTH_TOKEN
);

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Search for phone numbers available for purchase
 */
async function searchForAvailableNumbers(areaCode, limit) {
  const count = Math.min(limit, 30); // Twilio limit
  return await twilio
    .availablePhoneNumbers(process.env.PHONE_NUMBER_COUNTRY)
    .local.list({
      areaCode,
      limit: count,
      capabilities: ["SMS", "MMS"]
    });
}

/**
 * Buy a phone number
 */
async function buyNumber(phoneNumber) {
  const response = await twilio.incomingPhoneNumbers.create({
    phoneNumber,
    friendlyName: `Managed by Spoke: ${phoneNumber}`
  });
  if (response.error) {
    throw new Error(`Error buying twilio number: ${response.error}`);
  }
  console.log(`Bought number ${phoneNumber} [${response.sid}]`);
  return response.sid;
}

/**
 * Add bought phone number to a messging service
 */
async function addNumberToMessagingService(
  phoneNumberSid,
  messagingServiceSid
) {
  return await twilio.messaging
    .services(messagingServiceSid)
    .phoneNumbers.create({ phoneNumberSid });
}

async function main() {
  try {
    const { messagingServiceSid, areaCode, limit } = parseArgs(process.argv, {
      default: {
        limit: 1
      }
    });

    // VALIDATIONS
    if (typeof areaCode !== "number" || areaCode > 999) {
      console.error(`Invalid area code: ${areaCode}`);
      process.exit();
    }

    if (limit < 1 && limit > 200) {
      console.error("Limit should be between 1 and 200");
      process.exit();
    }

    let phoneNumbersToBuy = limit;

    do {
      const phoneNumbers = await searchForAvailableNumbers(
        areaCode,
        phoneNumbersToBuy
      );
      await asyncForEach(phoneNumbers, async phoneNumber => {
        const phoneNumberSid = await buyNumber(phoneNumber.phoneNumber);
        console.log(`Bought PhoneNumber: ${phoneNumber.phoneNumber}`);
        await addNumberToMessagingService(phoneNumberSid, messagingServiceSid);
        console.log(
          `Added PhoneNumber (${phoneNumber.phoneNumber}) to Messaging Serivce: ${messagingServiceSid}`
        );
      });
      phoneNumbersToBuy = phoneNumbersToBuy - 30;
    } while (phoneNumbersToBuy > 0);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

main().then(() => process.exit());
