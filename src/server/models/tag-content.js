import thinky from "./thinky";
import { requiredString, timestamp } from "./custom-types";
const type = thinky.type;
import Organization from "./organization";
import Message from "./message";
import CampaignContact from "./campaign-contact";
import Tag from "./tag";

const TagContent = thinky.createModel(
  "tag_content",
  type
    .object()
    .schema({
      id: type.string(),
      value: type.string(),
      tag_id: requiredString(),
      message_id: requiredString(),
      campaign_id: requiredString(),
      campaign_contact_id: requiredString(),
      created_at: timestamp(),
      updated_at: timestamp()
    })
    .allowExtra(false),
  {
    noAutoCreation: true,
    depenencies: [Tag, Message, Organization, CampaignContact]
  }
);

export default TagContent;
