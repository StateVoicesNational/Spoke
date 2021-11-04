import { getLastMessage } from "../message-sending";
import {
  Message,
  PendingMessagePart,
  r,
  cacheableData
} from "../../../server/models";
import uuid from "uuid";

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

export const getMetadata = () => ({
  supportsOrgConfig: false,
  supportsCampaignConfig: false,
  name: "fakeservice"
});

export async function sendMessage({
  message,
  contact,
  trx,
  organization,
  campaign
}) {
  const errorCode = message.text.match(/error(\d+)/);
  const changes = {
    service: "fakeservice",
    messageservice_sid: "fakeservice",
    send_status: "SENT",
    sent_at: new Date(),
    error_code: errorCode ? errorCode[1] : null
  };

  // console.log(
  //   "fakeservice sendMessage",
  //   message && message.id,
  //   contact && contact.id
  // );
  if (message && message.id) {
    let request = r.knex("message");
    if (trx) {
      request = request.transacting(trx);
    }
    // updating message!
    await request.where("id", message.id).update(changes);

    if (errorCode && message.campaign_contact_id) {
      await r
        .knex("campaign_contact")
        .where("id", message.campaign_contact_id)
        .update("error_code", errorCode[1]);
    }
  }

  if (contact && /autorespond/.test(message.text)) {
    // We can auto-respond to the the user if they include the text 'autorespond' in their message
    const media = /autorespondPicture/.test(message.text)
      ? [
          {
            type: "image/png",
            url: "https://static.moveon.org/giraffe/images/logo-black.png"
          }
        ]
      : null;
    await cacheableData.message.save({
      contact,
      messageInstance: new Message({
        ...message,
        ...changes,
        // just flip/renew the vars for the contact
        id: undefined,
        service_id: `mockedresponse${Math.random()}`,
        is_from_contact: true,
        text: `responding to ${message.text}`,
        send_status: "DELIVERED",
        media
      })
    });
  }
}

// None of the rest of this is even used for fake-service
// but *would* be used if it was actually an outside service.

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const text = firstPart.service_message;

  const lastMessage = await getLastMessage({
    contactNumber,
    service: "fakeservice",
    messageServiceSid: "fakeservice",
    userNumber
  });

  const service_id =
    firstPart.service_id ||
    `fakeservice_${Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "")}`;
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    error_code: null,
    service_id,
    campaign_contact_id: lastMessage.campaign_contact_id,
    messageservice_sid: "fakeservice",
    service: "fakeservice",
    send_status: "DELIVERED"
  });
}

export async function handleIncomingMessage(message) {
  const { contact_number, user_number, service_id, text } = message;
  const pendingMessagePart = new PendingMessagePart({
    service: "fakeservice",
    service_id,
    parent_id: null,
    service_message: text,
    user_number,
    contact_number
  });

  const part = await pendingMessagePart.save();
  return part.id;
}

export async function buyNumbersInAreaCode(organization, areaCode, limit) {
  const rows = [];
  for (let i = 0; i < limit; i++) {
    const last4 = limit.toString().padStart(4, "0");
    rows.push({
      organization_id: organization.id,
      area_code: areaCode,
      phone_number: `+1${areaCode}XYZ${last4}`,
      service: "fakeservice",
      service_id: uuid.v4()
    });
  }

  // add some latency
  await new Promise(resolve => setTimeout(resolve, limit * 25));
  await r.knex("owned_phone_number").insert(rows);
  return limit;
}

export async function deleteNumbersInAreaCode(organization, areaCode) {
  const numbersToDelete = (
    await r
      .knex("owned_phone_number")
      .select("service_id")
      .where({
        organization_id: organization.id,
        area_code: areaCode,
        service: "fakeservice",
        allocated_to: null
      })
  ).map(row => row.service_id);
  const count = numbersToDelete.length;
  // add some latency
  await new Promise(resolve => setTimeout(resolve, count * 25));
  await r
    .knex("owned_phone_number")
    .del()
    .whereIn("service_id", numbersToDelete);
  return count;
}

// Does a lookup for carrier and optionally the contact name
export async function getContactInfo({
  organization,
  contactNumber,
  // Boolean: maybe twilio-specific?
  lookupName
}) {
  if (!contactNumber) {
    return {};
  }
  const contactInfo = {
    carrier: "FakeCarrier",
    // -1 is a landline, 1 is a mobile number
    // we test against one of the lower digits to randomly
    // but deterministically vary on the landline
    status_code: contactNumber[11] === "2" ? -1 : 1
  };
  if (lookupName) {
    contactInfo.lookup_name = `Foo ${parseInt(Math.random() * 1000)}`;
  }
  return contactInfo;
}

export default {
  sendMessage,
  buyNumbersInAreaCode,
  deleteNumbersInAreaCode,
  // useless unused stubs
  convertMessagePartsToMessage,
  handleIncomingMessage,
  getMetadata
};
