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
      title: requiredString(),
      description: requiredString(),
      is_deleted: type.boolean().default(false),
      created_at: timestamp(),
      updated_at: timestamp(),
      organization_id: type.string()
    })
    .allowExtra(false),
  { noAutoCreation: true, depenencies: [Organization] }
);

export default Tag;
