import thinky from "./thinky";
import { requiredString, timestamp } from "./custom-types";
const type = thinky.type;
import CampaignContact from "./campaign-contact";
import Tag from "./tag";

const TagCampaignContact = thinky.createModel(
  "tag_campaign_contact",
  type
    .object()
    .schema({
      id: type.string(),
      value: type.string(),
      tag_id: requiredString(),
      campaign_contact_id: requiredString(),
      created_at: timestamp(),
      updated_at: timestamp()
    })
    .allowExtra(false),
  {
    noAutoCreation: true,
    depenencies: [Tag, CampaignContact]
  }
);

TagCampaignContact.ensureIndex("campaign_contact_id");

export default TagCampaignContact;
