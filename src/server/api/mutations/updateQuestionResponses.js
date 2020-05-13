import { log } from "../../../lib";
import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
const ActionHandlers = require("../../../integrations/action-handlers");

export const updateQuestionResponses = async (
  questionResponses,
  campaignContactId,
  loaders,
  user,
  done
) => {
  const contact = await loaders.campaignContact.load(campaignContactId);
  const campaign = await loaders.campaign.load(contact.campaign_id);
  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    contact.assignment_id,
    contact
  );

  cacheableData.questionResponse
    .save(campaignContactId, questionResponses)
    .then(async () => {
      // The rest is for ACTION_HANDLERS

      const actionHandlersConfigured = !!ActionHandlers.rawAllActionHandlers();
      if (actionHandlersConfigured) {
        const interactionSteps =
          campaign.interactionSteps ||
          (await cacheableData.campaign.dbInteractionSteps(campaign.id));

        const getAndProcessAction = async questionResponse => {
          const { interactionStepId, value } = questionResponse;

          const interactionStepResult = interactionSteps.filter(
            is =>
              is.answer_actions &&
              is.answer_option === value &&
              is.parent_interaction_id === Number(interactionStepId)
          );

          const interactionStepAction =
            interactionStepResult.length &&
            interactionStepResult[0].answer_actions;

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
            throw new Error("Handler not available");
          }

          try {
            await handler.processAction(
              questionResponse,
              interactionStepResult[0],
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
        if (done && done instanceof Function) {
          done();
        }
      }
    })
    .catch(err => {
      log.error(
        `Error saving updated QuestionResponse for campaignContactID ${campaignContactId} questionResponses ${JSON.stringify(
          questionResponses
        )} error ${err}`
      );
    });

  return contact;
};

export default updateQuestionResponses;
