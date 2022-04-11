import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp, optionalString } from "./custom-types";

const CannedResponse = thinky.createModel(
  "canned_response",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_id: requiredString(),
      text: requiredString(),
      title: requiredString(),
      user_id: optionalString(),
      created_at: timestamp(),
      answer_actions: optionalString(),
      answer_actions_data: optionalString()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

CannedResponse.ensureIndex("campaign_id");
CannedResponse.ensureIndex("user_id");

export default CannedResponse;
