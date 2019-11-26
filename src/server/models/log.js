import thinky from "./thinky";
import { requiredString, timestamp } from "./custom-types";

const type = thinky.type;

const Log = thinky.createModel(
  "log",
  type
    .object()
    .schema({
      id: type.string(),
      message_sid: requiredString(),
      body: type.string(),
      from_num: type.string(),
      to_num: type.string(),
      error_code: type
        .integer()
        .allowNull()
        .default(null),
      created_at: timestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default Log;
