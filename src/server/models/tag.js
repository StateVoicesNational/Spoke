import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp } from "./custom-types";
import Organization from "./organization";

const Tag = thinky.createModel(
  "tag",
  type
    .object()
    .schema({
      id: type.string(),
      name: requiredString(),
      group: type.string(),
      description: requiredString(),
      is_deleted: type.boolean().default(false),
      created_at: timestamp(),
      updated_at: timestamp(),
      organization_id: type.string()
    })
    .allowExtra(false),
  { noAutoCreation: true, depenencies: [Organization] }
);

Tag.ensureIndex("organization_is_deleted", doc => [
  doc("organization_id"),
  doc("is_deleted")
]);

export default Tag;
