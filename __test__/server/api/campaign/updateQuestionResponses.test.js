import {
  cleanupTest,
  createScript,
  createStartedCampaign,
  runGql,
  sendMessage,
  setupTest
} from "../../../test_helpers";

import { r } from "../../../../src/server/models";

describe("mutations.updateQuestionResponses", () => {
  let adminUser;
  let campaign;
  let texterUser;
  let contacts;
  let assignment;
  let interactionSteps;
  let returnedInteractionSteps;
  let colorInteractionSteps;
  let redInteractionStep;
  let shadesOfRedInteractionSteps;

  beforeEach(async () => {
    await setupTest();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  beforeEach(async () => {
    const startedCampaign = await createStartedCampaign();

    ({
      testAdminUser: adminUser,
      testCampaign: campaign,
      testTexterUser: texterUser,
      testContacts: contacts,
      assignment
    } = startedCampaign);

    interactionSteps = [
      {
        id: "new_1",
        questionText: "What is your favorite color",
        script: "Hello {firstName}. Let's talk about your favorite color.",
        answerOption: "",
        answerActions: "",
        answerActionsData: "",
        parentInteractionId: null,
        isDeleted: false,
        interactionSteps: [
          {
            id: "new_2",
            questionText: "What is your favorite shade of red?",
            script: "Red is an awesome color, {firstName}!",
            answerOption: "Red",
            answerActions: "",
            answerActionsData: "",
            parentInteractionId: "new_1",
            isDeleted: false,
            interactionSteps: [
              {
                id: "new_21",
                questionText: "",
                script: "Crimson is a rad shade of red, {firstName}",
                answerOption: "Crimson",
                answerActions: "",
                answerActionsData: "",
                parentInteractionId: "new_2",
                isDeleted: false,
                interactionSteps: []
              },
              {
                id: "new_22",
                questionText: "",
                script: "Firebrick is a rad shade of red, {firstName}",
                answerOption: "Firebrick",
                answerActions: "",
                answerActionsData: "",
                parentInteractionId: "new_2",
                isDeleted: false,
                interactionSteps: []
              }
            ]
          },
          {
            id: "new_3",
            questionText: "",
            script: "Purple is an awesome color, {firstName}!",
            answerOption: "Purple",
            answerActions: "",
            answerActionsData: "",
            parentInteractionId: "new_1",
            isDeleted: false,
            interactionSteps: []
          }
        ]
      }
    ];

    returnedInteractionSteps = (
      await createScript(adminUser, campaign, {
        interactionSteps: interactionSteps[0],
        campaignGqlFragment: `
        interactionSteps {
          id
          questionText
          script
          answerOption
          answerActions
          answerActionsData
          parentInteractionId
          isDeleted
        }
      `
      })
    ).data.editCampaign.interactionSteps;

    colorInteractionSteps = returnedInteractionSteps.filter(
      interactionStep =>
        interactionStep.parentInteractionId === returnedInteractionSteps[0].id
    );

    redInteractionStep = colorInteractionSteps.find(
      colorInteractionStep => colorInteractionStep.answerOption === "Red"
    );

    shadesOfRedInteractionSteps = returnedInteractionSteps.filter(
      interactionStep =>
        interactionStep.parentInteractionId === redInteractionStep.id
    );
  });

  it("records answers for a contact", async () => {
    const promises = contacts.slice(0, 2).map(contact => {
      return sendMessage(contact.id, texterUser, {
        text: returnedInteractionSteps[0].script,
        contactNumber: contact.cell,
        assignmentId: assignment.id,
        userId: texterUser.id.toString()
      });
    });

    const sendResults = await Promise.all(promises);

    expect(sendResults).toHaveLength(2);
    expect(sendResults[0].data.sendMessage.messageStatus).toEqual("messaged");
    expect(sendResults[1].data.sendMessage.messageStatus).toEqual("messaged");

    const updateQuestionResponseGql = `
      mutation updateQuestionResponses($qr: [QuestionResponseInput], $ccid: String!) {
        updateQuestionResponses(questionResponses: $qr, campaignContactId: $ccid) {
          id
          messageStatus
          questionResponseValues {
            interactionStepId
            value
          }
        }
      }
    `;

    const variables = {
      ccid: contacts[0].id,
      qr: [
        {
          campaignContactId: contacts[0].id,
          interactionStepId: returnedInteractionSteps[0].id,
          value: colorInteractionSteps[0].answerOption
        },
        {
          campaignContactId: contacts[0].id.toString(),
          interactionStepId: redInteractionStep.id,
          value: shadesOfRedInteractionSteps[0].answerOption
        }
      ]
    };

    const updateQuestionResponseResult = await runGql(
      updateQuestionResponseGql,
      variables,
      texterUser
    );

    expect(updateQuestionResponseResult.data.updateQuestionResponses).toEqual({
      id: contacts[0].id.toString(),
      messageStatus: "messaged",
      questionResponseValues: [
        {
          interactionStepId: Number(returnedInteractionSteps[0].id),
          value: colorInteractionSteps[0].answerOption
        },
        {
          interactionStepId: Number(colorInteractionSteps[0].id),
          value: shadesOfRedInteractionSteps[0].answerOption
        }
      ]
    });

    const databaseQuery = `
      SELECT
        child.answer_option,
        child.id as child_id,
        child.parent_interaction_id,
        interaction_step.campaign_id,
        interaction_step.question,
        interaction_step.script,
        child.answer_actions,
        question_response.value
      FROM
        question_response
      JOIN
        interaction_step ON interaction_step.id = question_response.interaction_step_id
      JOIN
        interaction_step as child ON child.parent_interaction_id = interaction_step.id and question_response.value = child.answer_option
      WHERE
        question_response.campaign_contact_id = ?
      ORDER BY
        question_response.id;
      `;

    const databaseQueryResults = await r.knex.raw(databaseQuery, [
      contacts[0].id
    ]);
    // WTF: sqlite returns result directly, while postgres in a .rows key
    expect(databaseQueryResults.rows || databaseQueryResults).toEqual([
      {
        answer_option: "Red",
        child_id: Number(colorInteractionSteps[0].id),
        parent_interaction_id: Number(returnedInteractionSteps[0].id),
        campaign_id: Number(campaign.id),
        question: "What is your favorite color",
        script: "Hello {firstName}. Let's talk about your favorite color.",
        answer_actions: "",
        value: "Red"
      },
      {
        answer_option: "Crimson",
        child_id: Number(shadesOfRedInteractionSteps[0].id),
        parent_interaction_id: Number(colorInteractionSteps[0].id),
        campaign_id: Number(campaign.id),
        question: "What is your favorite shade of red?",
        script: "Red is an awesome color, {firstName}!",
        answer_actions: "",
        value: "Crimson"
      }
    ]);
  });
});
