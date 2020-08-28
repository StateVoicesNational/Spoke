import thinky from "./thinky";
const type = thinky.type;
import { requiredString } from "./custom-types";

import User from "./user";
import Organization from "./organization";

const UserOrganization = thinky.createModel(
  "user_organization",
  type
    .object()
    .schema({
      id: type.string(),
      user_id: requiredString(),
      organization_id: requiredString(),
      role: requiredString().enum(
        "OWNER",
        "ADMIN",
        "SUPERVOLUNTEER",
        "TEXTER",
        "VETTED_TEXTER",
        "ORG_SUPERADMIN",
        "SUSPENDED"
      )
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [User, Organization] }
);

UserOrganization.ensureIndex("user_id");
UserOrganization.ensureIndex("organization_id");
UserOrganization.ensureIndex("organization_user", doc => [
  doc("organization_id"),
  doc("user_id")
]);

export default UserOrganization;
