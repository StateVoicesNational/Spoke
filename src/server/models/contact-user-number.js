import thinky from "./thinky";
const type = thinky.type;
import { requiredString } from "./custom-types";

// For documentation purposes only. Use knex queries instead of this model.
const ContactUserNumber = thinky.createModel(
  "contact_user_number",
  type
    .object()
    .schema({
      id: type.string(),
      organization_id: requiredString(),
      contact_number: requiredString(),
      user_number: requiredString()
    })
    .allowExtra(false)
);

export default ContactUserNumber;
