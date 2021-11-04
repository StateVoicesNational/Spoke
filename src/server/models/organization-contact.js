import thinky from "./thinky";
const type = thinky.type;
import {
  optionalString,
  requiredString,
  timestamp,
  optionalTimestamp
} from "./custom-types";
import Organization from "./organization";

// For documentation purposes only. Use knex queries instead of this model.
const OrganizationContact = thinky.createModel(
  "organization_contact",
  type
    .object()
    .schema({
      id: type.string(),
      organization_id: requiredString(),
      contact_number: requiredString(),
      user_number: optionalString(),
      service: optionalString(),
      subscribe_status: type.integer().default(0),
      // STATUS_CODE
      // -1 = landline
      // 1 = mobile or voip number
      // positive statuses should mean 'textable' and negative should mean untextable
      status_code: type.integer(),
      last_error_code: type.integer(),
      carrier: optionalString(),
      created_at: timestamp(),
      last_lookup: optionalTimestamp(),
      lookup_name: optionalString()
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [Organization] }
);

OrganizationContact.ensureIndex(
  "organization_contact_organization_contact_number",
  doc => [doc("contact_number"), doc("organization_id")]
);

OrganizationContact.ensureIndex(
  "organization_contact_organization_user_number",
  doc => [doc("organization_id"), doc("user_number")]
);

OrganizationContact.ensureIndex(
  "organization_contact_error_code_organization_id",
  doc => [doc("status_code"), doc("organization_id")]
);

export default OrganizationContact;
