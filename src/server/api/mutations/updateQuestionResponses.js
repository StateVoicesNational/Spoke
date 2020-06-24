import { log } from "../../../lib";
import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
import { runningInLambda } from "../lib/utils";
const ActionHandlers = require("../../../integrations/action-handlers");

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

  // The rest is for ACTION_HANDLERS
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

    const promises = [];
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
        return questionResponse;
      }

      // run interaction step handler
      const actionHandlerPromise = ActionHandlers.getActionHandler(
        interactionStepAction,
        organization,
        user
      )
        .then(async handler => {
          if (!handler) {
            return questionResponse;
          }
          const processActionPromise = handler
            .processAction(
              questionResponse,
              questionResponseInteractionStep,
              campaignContactId,
              contact,
              campaign,
              organization
            )
            .catch(err => {
              log.error(
                `Error executing handler for InteractionStep ${interactionStepId} InteractionStepAction ${interactionStepAction} error ${err}`
              );
            });
          promises.push(processActionPromise);
          return questionResponse;
        })
        .catch(err => {
          log.error(
            `Error loading handler for InteractionStep ${interactionStepId} InteractionStepAction ${interactionStepAction} error ${err}`
          );
        });
      promises.push(actionHandlerPromise);
      return questionResponse;
    });

    if (runningInLambda()) {
      await Promise.all(promises);
    }
  }
  return contact.id;
};

export default updateQuestionResponses;
