import { log } from "../../../lib";
import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
import { jobRunner } from "../../../integrations/job-runners";
import { Tasks } from "../../../workers/tasks";

const ActionHandlers = require("../../../integrations/action-handlers");

const dispatchActionHandlers = async ({
  user,
  contact,
  campaign,
  questionResponses
}) => {
  const actionHandlersConfigured =
    Object.keys(ActionHandlers.rawAllActionHandlers()).length > 0;

  if (actionHandlersConfigured) {
    const interactionSteps =
      campaign.interactionSteps ||
      (await cacheableData.campaign.dbInteractionSteps(campaign.id));

    const stepsWithActions = interactionSteps.filter(
      interactionStep => interactionStep.answer_actions
    );

    if (!stepsWithActions.length) {
      return contact.id;
    }

    const organization = await cacheableData.organization.load(
      campaign.organization_id
    );

    await Promise.all(
      questionResponses.map(async questionResponse => {
        const { interactionStepId, value } = questionResponse;

        const questionResponseInteractionStep = interactionSteps.find(
          is =>
            is.answer_actions &&
            is.answer_option === value &&
            is.parent_interaction_id === Number(interactionStepId)
        );

        const interactionStepAction =
          questionResponseInteractionStep &&
          questionResponseInteractionStep.answer_actions;

        if (!interactionStepAction) {
          return;
        }

        await jobRunner.dispatchTask(Tasks.ACTION_HANDLER_QUESTION_RESPONSE, {
          name: interactionStepAction,
          organization,
          user,
          questionResponse,
          questionResponseInteractionStep,
          campaign,
          contact
        });
      })
    );
  }
};

export const updateQuestionResponses = async (
  _,
  { questionResponses, campaignContactId },
  { user }
) => {
  const contact = await cacheableData.campaignContact.load(campaignContactId);
  const campaign = await cacheableData.campaign.load(contact.campaign_id);
  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    contact.assignment_id,
    contact
  );

  await cacheableData.questionResponse
    .save(campaignContactId, questionResponses)
    .catch(err => {
      log.error(
        `Error saving updated QuestionResponse for campaignContactID ${campaignContactId} questionResponses ${JSON.stringify(
          questionResponses
        )} error ${err}`
      );
    });

  try {
    await dispatchActionHandlers({
      user,
      questionResponses,
      campaign,
      contact
    });
  } catch (e) {
    console.error("Dispatching to one or more action handlers failed", e);
  }

  return contact.id;
};
