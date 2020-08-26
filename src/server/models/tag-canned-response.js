import thinky from "./thinky";
import { requiredString, timestamp } from "./custom-types";
const type = thinky.type;
import CannedResponse from "./canned-response";
import Tag from "./tag";

const TagCannedResponse = thinky.createModel(
  "tag_canned_response",
  type
    .object()
    .schema({
      id: type.string(),
      tag_id: requiredString(),
      canned_response_id: requiredString(),
      created_at: timestamp()
    })
    .allowExtra(false),
  {
    noAutoCreation: true,
    dependencies: [Tag, CannedResponse]
  }
);
