import { log } from "../../../lib";
import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
import { jobRunner } from "../../../extensions/job-runners";
import { Tasks } from "../../../workers/tasks";

const ActionHandlers = require("../../../extensions/action-handlers");

const dispatchActionHandlers = async ({
  user,
  contact,
  campaign,
  questionResponses,
  questionResponsesStatus
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

    const findInteractionStep = (value, interactionStepId) => {
      return interactionSteps.find(is => {
        return (
          is.answer_actions &&
          is.answer_option === value &&
          is.parent_interaction_id === Number(interactionStepId)
        );
      });
    };

    return Promise.all([
      ...questionResponses.map(async questionResponse => {
        const { interactionStepId, value } = questionResponse;

        const updatedPreviousValue =
          questionResponsesStatus.newOrUpdated[interactionStepId.toString()];

        if (updatedPreviousValue === undefined) {
          return Promise.resolve();
        }

        const interactionStep = findInteractionStep(value, interactionStepId);

        const interactionStepAction =
          interactionStep && interactionStep.answer_actions;

        if (!interactionStepAction) {
          return Promise.resolve();
        }

        return jobRunner.dispatchTask(Tasks.ACTION_HANDLER_QUESTION_RESPONSE, {
          name: interactionStepAction,
          organization,
          user,
          questionResponse,
          interactionStep,
          campaign,
          contact,
          wasDeleted: false,
          previousValue: updatedPreviousValue
        });
      }),
      ...questionResponsesStatus.deleted.map(async deletedQr => {
        const { interactionStepId, value } = deletedQr;
        const interactionStep = findInteractionStep(value, interactionStepId);

        const interactionStepAction =
          interactionStep && interactionStep.answer_actions;

        if (!interactionStepAction) {
          return Promise.resolve();
        }

        return jobRunner.dispatchTask(Tasks.ACTION_HANDLER_QUESTION_RESPONSE, {
          name: interactionStepAction,
          organization,
          user,
          questionResponse: {
            interactionStepId: interactionStepId.toString(),
            value,
            campaignContactId: contact.id
          },
          interactionStep,
          campaign,
          contact,
          wasDeleted: true,
          previousValue: value
        });
      })
    ]);
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

  const questionResponsesHash = {};
  questionResponses.forEach(questionResponse => {
    questionResponsesHash[
      questionResponse.interactionStepId
    ] = questionResponse;
  });

  const oldQuestionResponses = await cacheableData.questionResponse.query(
    campaignContactId
  );
  oldQuestionResponses.forEach(oldQuestionResponse => {
    const newQuestionResponse =
      questionResponsesHash[oldQuestionResponse.interaction_step_id];
    if (
      newQuestionResponse &&
      newQuestionResponse.value === oldQuestionResponse.value
    ) {
      delete questionResponsesHash[
        oldQuestionResponse.interaction_step_id.toString()
      ];
    }
  });

  const questionResponsesStatus = await cacheableData.questionResponse
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
      contact,
      questionResponsesStatus
    });
  } catch (e) {
    console.error("Dispatching to one or more action handlers failed", e);
  }

  return contact.id;
};
