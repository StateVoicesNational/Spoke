const parseArgs = require("minimist");
import twilio from "../src/server/api/lib/twilio";
import { Campaign } from "../src/server/models";

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
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
      const phoneNumbers = await twilio.searchForAvailableNumbers(
        areaCode,
        phoneNumbersToBuy
      );
      await asyncForEach(phoneNumbers, async phoneNumber => {
        const phoneNumberSid = await twilio.buyNumber(phoneNumber.phoneNumber);
        console.log(`Bought PhoneNumber: ${phoneNumber.phoneNumber}`);
        await twilio.addNumberToMessagingService(
          phoneNumberSid,
          messagingServiceSid
        );
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
