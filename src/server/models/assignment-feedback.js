import thinky from "./thinky";
import { requiredString, optionalString, timestamp } from "./custom-types";

const type = thinky.type;

const AssignmentFeedback = thinky.createModel(
  "assignment_feedback",
  type
    .object()
    .schema({
      id: type.string(),
      creator_id: requiredString(),
      assignment_id: requiredString(),
      created_at: timestamp(),
      feedback: optionalString(),
      is_acknowledged: type.bool().default(false)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

AssignmentFeedback.ensureIndex("assignment_id");
AssignmentFeedback.ensureIndex("creator_id");

export default AssignmentFeedback;
