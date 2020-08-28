import { mapFieldsToModel } from "./lib/utils";
import { InteractionStep, r } from "../models";
import { accessRequired } from "./errors";

export const resolvers = {
  InteractionStep: {
    ...mapFieldsToModel(
      [
        "id",
        "script",
        "answerOption",
        "answerActions",
        "parentInteractionId",
        "isDeleted"
      ],
      InteractionStep
    ),
    questionText: async interactionStep => {
      return interactionStep.question;
    },
    question: async interactionStep => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) => {
      return r
        .table("question_response")
        .getAll(campaignContactId, { index: "campaign_contact_id" })
        .filter({
          interaction_step_id: interactionStep.id
        })
        .limit(1)(0)
        .default(null);
    },
    answerActionsData: async (interactionStep, _, { user, loaders }) => {
      const campaign = await loaders.campaign.load(interactionStep.campaign_id);
      await accessRequired(user, campaign.organization_id, "SUPERVOLUNTEER");
      return interactionStep.answer_actions_data;
    }
  }
};
