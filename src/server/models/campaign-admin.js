import thinky from "./thinky";
const type = thinky.type;
import { optionalString, requiredString, timestamp } from "./custom-types";

const CampaignAdmin = thinky.createModel(
  "campaign_admin",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_id: requiredString(),
      ingest_method: optionalString(),
      ingest_data_reference: optionalString(),
      ingest_result: optionalString(),
      ingest_success: type.boolean(),
      contacts_count: type.number().integer(),
      deleted_optouts_count: type.number().integer(),
      duplicate_contacts_count: type.number().integer(),
      updated_at: timestamp(),
      created_at: timestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

CampaignAdmin.ensureIndex("campaign_id");

export default CampaignAdmin;
