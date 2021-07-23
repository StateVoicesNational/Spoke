import Nexmo from "nexmo";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { Message, PendingMessagePart } from "../../models";
import { getLastMessage } from "./message-sending";
import { log } from "../../../lib";

// NEXMO error_codes:
// If status is a number, then it will be the number
// however report.status is a word, so is error_code is the charCodeAt of the first letter
// expired: 101
// failed: 102
// rejected: 114
// network error or other connection failure: 1

let nexmo = null;
const MAX_SEND_ATTEMPTS = 5;
if (process.env.NEXMO_API_KEY && process.env.NEXMO_API_SECRET) {
  nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  });
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const serviceMessages = messageParts.map(part =>
    JSON.parse(part.service_message)
  );
  const text = serviceMessages
    .map(serviceMessage => serviceMessage.text)
    .join("");

  const lastMessage = await getLastMessage({
    contactNumber,
    service: "nexmo",
    // Nexmo has nothing better that is both from sent and received message repsonses:
    messageServiceSid: "nexmo"
  });

  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    error_code: null,
    text,
    service_id: serviceMessages[0].service_id,
    campaign_contact_id: lastMessage.campaign_contact_id,
    messageservice_sid: userNumber,
    service: "nexmo",
    send_status: "DELIVERED"
  });
}

async function findNewCell() {
  if (!nexmo) {
    const num = "1234"
      .split("")
      .map(() => parseInt(Math.random() * 10))
      .join("");
    return {
      numbers: [{ msisdn: getFormattedPhoneNumber(`+1212555${num}`) }]
    };
  }
  return new Promise((resolve, reject) => {
    nexmo.number.search(
      "US",
      { features: "VOICE,SMS", size: 1 },
      (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
}

async function rentNewCell() {
  if (!nexmo) {
    return getFormattedPhoneNumber(faker.phone.phoneNumber());
  }
  const newCell = await findNewCell();

  if (
    newCell &&
    newCell.numbers &&
    newCell.numbers[0] &&
    newCell.numbers[0].msisdn
  ) {
    return new Promise((resolve, reject) => {
      nexmo.number.buy("US", newCell.numbers[0].msisdn, (err, response) => {
        if (err) {
          reject(err);
        } else {
          // It appears we need to check error-code in the response even if response is returned.
          // This library returns responses that look like { error-code: 401, error-label: 'not authenticated'}
          // or the bizarrely-named { error-code: 200 } even in the case of success
          if (response["error-code"] !== "200") {
            reject(new Error(response["error-code-label"]));
          } else {
            resolve(newCell.numbers[0].msisdn);
          }
        }
      });
    });
  }
  throw new Error("Did not find any cell");
}

async function sendMessage(message, contact, trx, organization, campaign) {
  if (!nexmo) {
    const options = trx ? { transaction: trx } : {};
    await Message.get(message.id).update({ send_status: "SENT" }, options);
    return "test_message_uuid";
  }
  // FIXME|TODO: user_number is not set before
  // until this is fixed, Nexmo will NOT work
  // FUTURE: user_number should be decided here
  // -- though that might need some more context, e.g. organization
  const userNumber = message.user_number.replace(/^\+/, "");
  return new Promise((resolve, reject) => {
    // US numbers require that the + be removed when sending via nexmo
    nexmo.message.sendSms(
      userNumber,
      message.contact_number,
      message.text,
      {
        "status-report-req": 1,
        "client-ref": message.id
      },
      (err, response) => {
        const messageToSave = {
          ...message
        };
        let hasError = false;
        if (err) {
          hasError = 1;
        }
        if (response) {
          response.messages.forEach(serviceMessages => {
            if (serviceMessages.status !== "0") {
              hasError = serviceMessages.status;
            }
          });
        }

        messageToSave.service = "nexmo";
        //userNum is required so can be tracked as messageservice_sid
        messageToSave.messageservice_sid = getFormattedPhoneNumber(userNumber);
        messageToSave.campaign_contact_id = contact.id;

        if (hasError) {
          if (messageToSave.service_messages.length >= MAX_SEND_ATTEMPTS) {
            messageToSave.send_status = "ERROR";
            messageToSave.error_code =
              Number(hasError) || hasError.charCodeAt(0);
          }
          let options = { conflict: "update" };
          if (trx) {
            options.transaction = trx;
          }
          Message.save(messageToSave, options)
            // eslint-disable-next-line no-unused-vars
            .then((_, newMessage) => {
              reject(
                err ||
                  (response
                    ? new Error(JSON.stringify(response))
                    : new Error("Encountered unknown error"))
              );
            });
          // FUTURE: insert log record with service response
        } else {
          let options = { conflict: "update" };
          if (trx) {
            options.transaction = trx;
          }
          Message.save(
            {
              ...messageToSave,
              send_status: "SENT"
            },
            options
          ).then((saveError, newMessage) => {
            resolve(newMessage);
          });
        }
      }
    );
  });
}

async function handleDeliveryReport(report) {
  if (report.hasOwnProperty("client-ref")) {
    const message = await Message.get(report["client-ref"]);
    // FUTURE: insert log record with JSON.stringify(report)
    if (report.status === "delivered" || report.status === "accepted") {
      message.send_status = "DELIVERED";
    } else if (
      report.status === "expired" ||
      report.status === "failed" ||
      report.status === "rejected"
    ) {
      message.send_status = "ERROR";
      const errCode = report["err-code"];
      messageToSave.error_code = Number(errCode) || 0;
    }
    await Message.save(message, { conflict: "update" });
  }
}

async function handleIncomingMessage(message) {
  if (
    !message.hasOwnProperty("to") ||
    !message.hasOwnProperty("msisdn") ||
    !message.hasOwnProperty("text") ||
    !message.hasOwnProperty("messageId")
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
  }

  const { to, msisdn, concat } = message;
  const isConcat = concat === "true";
  const contactNumber = getFormattedPhoneNumber(msisdn);
  const userNumber = getFormattedPhoneNumber(to);

  let parentId = "";
  if (isConcat) {
    log.info(
      `Incoming message part (${message["concat-part"]} of ${message["concat-total"]} for ref ${message["concat-ref"]}) from ${contactNumber} to ${userNumber}`
    );
    parentId = message["concat-ref"];
  } else {
    log.info(`Incoming message part from ${contactNumber} to ${userNumber}`);
  }

  const pendingMessagePart = new PendingMessagePart({
    service: "nexmo",
    service_id: message["concat-ref"] || message.messageId,
    parent_id: parentId, // do we need this anymore, now we have service_id?
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  });

  const part = await pendingMessagePart.save();
  return part.id;
}

export default {
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage
};
