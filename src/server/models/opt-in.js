import thinky from "./thinky";
const type = thinky.type;
import { optionalString, requiredString, timestamp } from "./custom-types";

import Organization from "./organization";
import Assignment from "./assignment";

const OptIn = thinky.createModel(
  "opt_in",
  type
    .object()
    .schema({
      id: type.string(),
      cell: requiredString(),
      assignment_id: optionalString(),
      organization_id: requiredString(),
      reason_code: optionalString(),  
      created_at: timestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [Organization, Assignment] }
);

OptIn.ensureIndex("cell");
OptIn.ensureIndex("assignment_id");
OptIn.ensureIndex("organization_id");

export default OptIn;
