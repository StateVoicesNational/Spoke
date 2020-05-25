import thinky from "./thinky";
const type = thinky.type;
import { requiredString, optionalString, timestamp } from "./custom-types";

import Organization from "./organization";

const Campaign = thinky.createModel(
  "campaign",
  type
    .object()
    .schema({
      id: type.string(),
      organization_id: requiredString(),
      creator_id: type
        .string()
        .allowNull(true)
        .foreign("user"),
      title: optionalString(),
      description: optionalString(),
      join_token: optionalString().allowNull(true),
      batch_size: type.integer().allowNull(true),
      features: type.string().allowNull(true),
      is_started: type.boolean().required(),
      due_by: type
        .date()
        .required()
        .default(null),
      created_at: timestamp(),
      is_archived: type.boolean().required(),
      use_dynamic_assignment: type.boolean().required(),
      logo_image_url: type.string(),
      intro_html: type.string(),
      primary_color: type.string(),
      use_own_messaging_service: type.boolean().required(),
      messageservice_sid: type.string().required(),
      override_organization_texting_hours: type
        .boolean()
        .required()
        .default(false),
      texting_hours_enforced: type
        .boolean()
        .required()
        .default(true),
      texting_hours_start: type
        .number()
        .integer()
        .required()
        .min(0)
        .max(23)
        .default(9),
      texting_hours_end: type
        .number()
        .integer()
        .required()
        .min(0)
        .max(23)
        .default(21),
      timezone: type
        .string()
        .required()
        .default("US/Eastern")
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

Campaign.ensureIndex("organization_id");
Campaign.ensureIndex("creator_id");
Campaign.ensureIndex("join_token");

export default Campaign;
