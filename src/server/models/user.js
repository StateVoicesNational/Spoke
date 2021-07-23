import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp } from "./custom-types";

const User = thinky.createModel(
  "user",
  type
    .object()
    .schema({
      id: type.string(),
      // LEGACY name, but contains the auth0_id OR the auth secret/token
      auth0_id: requiredString().stopReference(),
      first_name: requiredString(),
      last_name: requiredString(),
      alias: type.string().default(null),
      cell: requiredString(),
      email: requiredString(),
      created_at: timestamp(),
      assigned_cell: type.string(),
      is_superadmin: type.boolean(),
      terms: type.boolean().default(false),
      extra: type.string().default(null)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default User;
