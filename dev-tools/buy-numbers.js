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
    const { campaign, areaCode, limit } = parseArgs(process.argv, {
      default: {
        limit: 1
      }
    });

    // VALIDATIONS
    if (typeof areaCode !== "number" || areaCode > 999) {
      console.error(`Invalid area code: ${areaCode}`);
      process.exit();
    }

    if (campaign === undefined) {
      console.error(`Invalid Campaign ID: ${campaign}`);
      process.exit();
    }

    const messagingServiceSid = (await Campaign.get(campaign))
      .messaging_service_sid;

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
