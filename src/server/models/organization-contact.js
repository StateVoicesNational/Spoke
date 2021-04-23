import thinky from "./thinky";
const type = thinky.type;
import { optionalString, requiredString } from "./custom-types";

// For documentation purposes only. Use knex queries instead of this model.
const OrganizationContact = thinky.createModel(
  "organization_contact",
  type
    .object()
    .schema({
      id: type.string(),
      organization_id: requiredString(),
      contact_number: requiredString(),
      user_number: optionalString()
    })
    .allowExtra(false)
);

export default OrganizationContact;
