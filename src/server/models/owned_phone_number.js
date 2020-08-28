import thinky from "./thinky";
const type = thinky.type;
import {
  optionalString,
  optionalTimestamp,
  requiredString,
  timestamp
} from "./custom-types";

// For documentation purposes only. Use knex queries instead of this model.
const OwnedPhoneNumber = thinky.createModel(
  "owned_phone_number",
  type
    .object()
    .schema({
      id: requiredString(),
      service: requiredString(),
      service_id: requiredString().stopReference(),
      organization_id: requiredString(),
      phone_number: requiredString(),
      allocated_to: optionalString(),
      allocated_to_id: optionalString().stopReference(),
      allocated_at: optionalTimestamp(),
      created_at: timestamp()
    })
    .allowExtra(false)
);
