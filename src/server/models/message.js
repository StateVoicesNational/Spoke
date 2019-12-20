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
      assignment_id: requiredString(),
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
      error_code: type
        .integer()
        .allowNull()
        .default(null),
      created_at: timestamp(),
      queued_at: timestamp(),
      sent_at: timestamp(),
      service_response_at: timestamp(),
      send_before: optionalTimestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [User, Assignment] }
);

Message.ensureIndex("user_id");
Message.ensureIndex("assignment_id");
Message.ensureIndex("send_status");
Message.ensureIndex("contact_number");
Message.ensureIndex("service_id");

export default Message;
