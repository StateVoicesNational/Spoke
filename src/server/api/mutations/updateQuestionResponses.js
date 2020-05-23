import { log } from "../../../lib";
import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
const ActionHandlers = require("../../../integrations/action-handlers");

export const updateQuestionResponses = async (
  _,
  { questionResponses, campaignContactId },
  { loaders, user }
) => {
  let contact = await loaders.campaignContact.load(campaignContactId);
  const campaign = await loaders.campaign.load(contact.campaign_id);
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

  contact = await loaders.campaignContact.load(campaignContactId);

  // The rest is for ACTION_HANDLERS
  const interactionSteps = await cacheableData.campaign.dbInteractionSteps(
    campaign.id
  );

  const stepsWithActions = interactionSteps.filter(
    interactionStep => interactionStep.answer_actions
  );

  const actionHandlersConfigured =
    Object.keys(ActionHandlers.rawAllActionHandlers()).length > 0;

  if (stepsWithActions.length && !actionHandlersConfigured) {
    log.error(
      "Encountered one or more interaction steps with an action handler but no action handlers are configured"
    );
    return contact;
  }

  if (stepsWithActions.length && actionHandlersConfigured) {
    const getAndProcessAction = async questionResponse => {
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

      const organization = await loaders.organization.load(
        campaign.organization_id
      );

      // run interaction step handler
      let handler;
      try {
        handler = await ActionHandlers.getActionHandler(
          interactionStepAction,
          organization,
          user
        );
      } catch (err) {
        log.error(
          `Error loading handler for InteractionStep ${interactionStepId} InteractionStepAction ${interactionStepAction} error ${err}`
        );
      }
      if (!handler) {
        return;
      }

      try {
        await handler.processAction(
          questionResponse,
          questionResponseInteractionStep,
          campaignContactId,
          contact,
          campaign,
          organization
        );
      } catch (err) {
        log.error(
          `Error executing handler for InteractionStep ${interactionStepId} InteractionStepAction ${interactionStepAction} error ${err}`
        );
      }
    };

    const promises = questionResponses.map(getAndProcessAction);
    await Promise.all(promises);
  }

  return contact;
};

export default updateQuestionResponses;
