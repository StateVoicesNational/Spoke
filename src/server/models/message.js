import thinky from "./thinky";
const type = thinky.type;
import {
  requiredString,
  optionalString,
  timestamp,
  optionalTimestamp
} from "./custom-types";

import User from "./user";
import Assignment from "./assignment";

const Message = thinky.createModel(
  "message",
  type
    .object()
    .schema({
      id: type.string(),
      // Assignments may change, so attribute the message to the specific
      // texter account that sent it
      user_id: type.string().allowNull(true),
      // theoretically the phone number
      // userNumber should stay constant for a
      // texter, but this is not guaranteed
      user_number: optionalString(),
      contact_number: requiredString(),
      is_from_contact: type
        .boolean()
        .required()
        .allowNull(false),
      text: optionalString(),
      // for errors,etc returned back by the service
      // will be several json strings appended together, so JSON.parse will NOT work
      service_response: optionalString(),
      assignment_id: optionalString(), //deprecated: use refs by campaign_contact_id or user_id
      campaign_contact_id: requiredString(),
      messageservice_sid: optionalString().stopReference(),
      service: optionalString(),
      service_id: optionalString().stopReference(),
      send_status: requiredString().enum(
        "QUEUED",
        "SENDING",
        "SENT",
        "DELIVERED",
        "ERROR",
        "PAUSED",
        "NOT_ATTEMPTED"
      ),
      created_at: timestamp(),
      queued_at: timestamp(),
      sent_at: timestamp(),
      service_response_at: timestamp(),
      send_before: optionalTimestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [User, Assignment] }
);

Message.ensureIndex("campaign_contact_id"); // necessary to get message list for contact
Message.ensureIndex("send_status"); // needed in jobs to search for QUEUED
Message.ensureIndex("service_id"); // necessary to lookup a message by the service_id
Message.ensureIndex("cell_messageservice_sid", (doc) => [doc("contact_number"), doc("messageservice_sid")]);

export default Message;
