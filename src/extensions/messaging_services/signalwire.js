// import { getLastMessage } from "./message-sending";
// import { Message, PendingMessagePart, r, cacheableData } from "../../models";
// import uuid from "uuid";

// // This 'fakeservice' allows for fake-sending messages
// // that end up just in the db appropriately and then using sendReply() graphql
// // queries for the reception (rather than a real service)

// const { RestClient } = require("@signalwire/node");
// const client = new RestClient(
//   "09e73104-d04c-42fc-9bc2-79b1cf02e816",
//   "PTfd325b96918b23e20f530aca744e7a8c2039d8f083ed0efa",
//   {
//     signalwireSpaceUrl: "larryperson.signalwire.com"
//   }
// );

// const sendMessage = async (message, contact, trx, organization, campaign) => {
//   console.log(message, contact);
//   const messageParams = {
//     to: message.contact_number,
//     body: message.text,
//     from: "6df96092-add0-4d84-8f01-5985d756a9f6",
//     application_sid: "881be3d8-2c40-4ae5-b6cc-ede8d1ab622c"
//   };
//   try {
//     const messageResult = await client.messages.create(messageParams);
//     console.log(messageResult);
//   } catch (caught) {
//     console.log(caught);
//   }

//   // console.log(
//   //   "fakeservice sendMessage",
//   //   message && message.id,
//   //   contact && contact.id
//   // );
//   // if (message && message.id) {
//   //   let request = r.knex("message");
//   //   if (trx) {
//   //     request = request.transacting(trx);
//   //   }
//   //   // updating message!
//   //   await request.where("id", message.id).update(changes);

//   //   if (errorCode && message.campaign_contact_id) {
//   //     await r
//   //       .knex("campaign_contact")
//   //       .where("id", message.campaign_contact_id)
//   //       .update("error_code", errorCode[1]);
//   //   }
//   // }
// };

// // None of the rest of this is even used for fake-service
// // but *would* be used if it was actually an outside service.

// async function convertMessagePartsToMessage(messageParts) {
//   // const firstPart = messageParts[0];
//   // const userNumber = firstPart.user_number;
//   // const contactNumber = firstPart.contact_number;
//   // const text = firstPart.service_message;
//   // const lastMessage = await getLastMessage({
//   //   contactNumber,
//   //   service: "fakeservice",
//   //   messageServiceSid: "fakeservice"
//   // });
//   // const service_id =
//   //   firstPart.service_id ||
//   //   `fakeservice_${Math.random()
//   //     .toString(36)
//   //     .replace(/[^a-zA-Z1-9]+/g, "")}`;
//   // return new Message({
//   //   contact_number: contactNumber,
//   //   user_number: userNumber,
//   //   is_from_contact: true,
//   //   text,
//   //   error_code: null,
//   //   service_id,
//   //   campaign_contact_id: lastMessage.campaign_contact_id,
//   //   messageservice_sid: "fakeservice",
//   //   service: "fakeservice",
//   //   send_status: "DELIVERED"
//   // });
// }

// async function handleIncomingMessage(message) {
//   // const { contact_number, user_number, service_id, text } = message;
//   // const pendingMessagePart = new PendingMessagePart({
//   //   service: "fakeservice",
//   //   service_id,
//   //   parent_id: null,
//   //   service_message: text,
//   //   user_number,
//   //   contact_number
//   // });
//   // const part = await pendingMessagePart.save();
//   // return part.id;
// }

// async function buyNumbersInAreaCode(organization, areaCode, limit) {
//   // const rows = [];
//   // for (let i = 0; i < limit; i++) {
//   //   const last4 = limit.toString().padStart(4, "0");
//   //   rows.push({
//   //     organization_id: organization.id,
//   //     area_code: areaCode,
//   //     phone_number: `+1${areaCode}XYZ${last4}`,
//   //     service: "fakeservice",
//   //     service_id: uuid.v4()
//   //   });
//   // }
//   // add some latency
//   // await new Promise(resolve => setTimeout(resolve, limit * 25));
//   // await r.knex("owned_phone_number").insert(rows);
//   // return limit;
// }

// export default {
//   sendMessage,
//   buyNumbersInAreaCode,
//   // useless unused stubs
//   convertMessagePartsToMessage,
//   handleIncomingMessage
// };
