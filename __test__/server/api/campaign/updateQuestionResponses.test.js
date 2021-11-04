/**
 * @jest-environment jsdom
 */
import {
  cleanupTest,
  createScript,
  createStartedCampaign,
  runGql,
  sendMessage,
  setupTest,
  makeRunnableMutations,
  sleep
} from "../../../test_helpers";

import * as Mutations from "../../../../src/server/api/mutations/";
const ActionHandlers = require("../../../../src/extensions/action-handlers");
const ComplexTestActionHandler = require("../../../../src/extensions/action-handlers/complex-test-action");
import { jobRunner } from "../../../../src/extensions/job-runners";

import { r, cacheableData, createLoaders } from "../../../../src/server/models";
const errors = require("../../../../src/server/api/errors");

import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import {
  operations as assignmentTexterOps,
  AssignmentTexterContact
} from "../../../../src/containers/AssignmentTexterContact";
import { AssignmentTexterContactControls } from "../../../../src/components/AssignmentTexter/Controls";
import {
  campaignQuery,
  contactDataFragment
} from "../../../../src/containers/TexterTodo";

describe("mutations.updateQuestionResponses", () => {
  let adminUser;
  let campaign;
  let texterUser;
  let contacts;
  let assignment;
  let interactionSteps;
  let colorInteractionSteps;
  let redInteractionStep;
  let shadesOfRedInteractionSteps;
  let questionResponses;
  let questionResponseValuesDatabaseSql;
  let organization;
  const loaders = createLoaders();
  beforeEach(async () => {
    await cleanupTest();
    await setupTest();
    jest.restoreAllMocks();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  afterEach(async () => {
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

  const saveInteractionStepsAndSendInitialMessages = async (
    inputInteractionSteps,
    numberOfContacts = 1
  ) => {
    const returnedInteractionSteps = (
      await createScript(adminUser, campaign, {
        interactionSteps: inputInteractionSteps[0],
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

    // we've created a script with this outline:
    // What's your favorite color?
    // Answer: Red
    //   What's your favorite shade of red?
    //     Answer: firebrick
    //     Answer: crimson
    // Answer: Purple

    // these are the answers to the question "what's your favorite color?"
    const toReturnColorInteractionSteps = returnedInteractionSteps.filter(
      interactionStep =>
        interactionStep.parentInteractionId === returnedInteractionSteps[0].id
    );

    // this is the interaction step representing the answer "Red"
    const toReturnRedInteractionStep = toReturnColorInteractionSteps.find(
      colorInteractionStep => colorInteractionStep.answerOption === "Red"
    );

    // these are the answers to the question "what's your favorite shade of red"
    const toReturnShadesOfRedInteractionSteps = returnedInteractionSteps.filter(
      interactionStep =>
        interactionStep.parentInteractionId === toReturnRedInteractionStep.id
    );

    // send initial messages to 2 contacts
    const promises = contacts.slice(0, numberOfContacts).map(contact => {
      return sendMessage(contact.id, texterUser, {
        text: returnedInteractionSteps[0].script,
        contactNumber: contact.cell,
        assignmentId: assignment.id,
        userId: texterUser.id.toString()
      });
    });

    await Promise.all(promises);

    return {
      interactionSteps: returnedInteractionSteps,
      colorInteractionSteps: toReturnColorInteractionSteps,
      redInteractionStep: toReturnRedInteractionStep,
      shadesOfRedInteractionSteps: toReturnShadesOfRedInteractionSteps
    };
  };

  beforeEach(async () => {
    questionResponseValuesDatabaseSql = `
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

    const startedCampaign = await createStartedCampaign();
    ({
      testOrganization: {
        data: { createOrganization: organization }
      },
      testAdminUser: adminUser,
      testCampaign: campaign,
      testTexterUser: texterUser,
      testContacts: contacts,
      assignment
    } = startedCampaign);
  });

  describe("when called through the mutation", () => {
    beforeEach(async () => {
      const inputInteractionSteps = [
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

      ({
        interactionSteps,
        redInteractionStep,
        shadesOfRedInteractionSteps,
        colorInteractionSteps
      } = await saveInteractionStepsAndSendInitialMessages(
        inputInteractionSteps,
        2
      ));

      questionResponses = [
        {
          campaignContactId: contacts[0].id,
          interactionStepId: interactionSteps[0].id,
          value: colorInteractionSteps[0].answerOption
        },
        {
          campaignContactId: contacts[0].id,
          interactionStepId: redInteractionStep.id,
          value: shadesOfRedInteractionSteps[0].answerOption
        }
      ];
    });

    it("it records answers for a contact", async () => {
      // verify that contacts have messageStatus === 'messaged'
      const results = await r
        .knex("campaign_contact")
        .select("message_status")
        .whereIn(
          "id",
          contacts.slice(0, 2).map(contact => contact.id)
        );

      expect(results).toEqual([
        {
          message_status: "messaged"
        },
        {
          message_status: "messaged"
        }
      ]);

      const updateQuestionResponseGql = `
      mutation updateQuestionResponses($qr: [QuestionResponseInput], $ccid: String!) {
        updateQuestionResponses(questionResponses: $qr, campaignContactId: $ccid)
      }
    `;

      const variables = {
        ccid: contacts[0].id,
        qr: questionResponses
      };

      // this returns immediately before doing any updates
      const updateQuestionResponseResult = await runGql(
        updateQuestionResponseGql,
        variables,
        texterUser
      );

      // verify that updateQuestionResponses returns what we expect
      expect(updateQuestionResponseResult.data.updateQuestionResponses).toEqual(
        contacts[0].id.toString()
      );

      const databaseQueryResults = await r.knex.raw(
        questionResponseValuesDatabaseSql,
        [contacts[0].id]
      );

      // verify that updateQuestionResponses really updated the question_responses

      // databaseQueryResults.rows will be truthy if we're using postgres
      // and short circuit, otherwise for sqlite databaseQueryResults will
      // contain the rows
      expect(databaseQueryResults.rows || databaseQueryResults).toEqual([
        {
          answer_option: "Red",
          child_id: Number(colorInteractionSteps[0].id),
          parent_interaction_id: Number(interactionSteps[0].id),
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

    describe("when called through the UI, it updates answers for a contact", () => {
      let updatedCampaign;
      let updatedContacts;
      let updatedAssignment;

      beforeEach(async () => {
        const variables = {
          assignmentId: assignment.id.toString()
        };

        const retrievedAssignment = await runGql(
          campaignQuery,
          variables,
          adminUser
        );

        ({
          data: { assignment: updatedAssignment }
        } = retrievedAssignment);

        updatedCampaign = updatedAssignment.campaign;

        const getAssignmentContactsGql = `
        mutation getAssignmentContacts($assignmentId: String!, $contactIds: [String]!, $findNew: Boolean) {
          getAssignmentContacts(assignmentId: $assignmentId, contactIds: $contactIds, findNew: $findNew) {
            ${contactDataFragment}
          }
        }
      `;

        const getAssignmentVariables = {
          assignmentId: assignment.id,
          contactIds: contacts[0].id,
          findNew: false
        };

        const retrievedContacts = await runGql(
          getAssignmentContactsGql,
          getAssignmentVariables,
          adminUser
        );

        ({
          data: { getAssignmentContacts: updatedContacts }
        } = retrievedContacts);
      });

      it("causes the database to be updated correctly", async () => {
        const navigationToolbarChildren = {
          onNext: jest.fn(),
          onPrevious: jest.fn(),
          title: "1 of 2",
          total: 2,
          currentIndex: 1
        };
        StyleSheetTestUtils.suppressStyleInjection();

        const wrappedMutations = makeRunnableMutations(
          assignmentTexterOps.mutations,
          texterUser
        );

        const component = await mount(
          <AssignmentTexterContact
            mutations={wrappedMutations}
            find-me="here"
            texter={{ ...texterUser }}
            campaign={{ ...updatedCampaign }}
            assignment={{ ...updatedAssignment }}
            refreshData={jest.fn()}
            contact={{ ...updatedContacts[0] }}
            navigationToolbarChildren={navigationToolbarChildren}
            location={{ query: {} }}
          />
        );

        const assignmentTexterContactWrapper = component.find(
          AssignmentTexterContact
        );

        const assignmentTexterContact = assignmentTexterContactWrapper.instance();

        const controlsWrapper = assignmentTexterContactWrapper.find(
          AssignmentTexterContactControls
        );

        const controls = controlsWrapper.instance();

        controls.handleQuestionResponseChange({
          interactionStep: interactionSteps[0],
          questionResponseValue: "Red"
        });

        await assignmentTexterContact.handleSubmitSurveys();

        const databaseQueryResults = await r.knex.raw(
          questionResponseValuesDatabaseSql,
          [updatedContacts[0].id]
        );

        expect(databaseQueryResults.rows || databaseQueryResults).toEqual([
          {
            answer_actions: "",
            answer_option: "Red",
            campaign_id: 1,
            child_id: 2,
            parent_interaction_id: 1,
            question: "What is your favorite color",
            script: "Hello {firstName}. Let's talk about your favorite color.",
            value: "Red"
          }
        ]);
      });
    });
  });

  describe("#updateQuestionResponses", () => {
    let inputInteractionStepsWithActionHandlers;
    let inputInteractionStepsWithoutActionHandlers;

    beforeEach(async () => {
      inputInteractionStepsWithoutActionHandlers = [
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

      inputInteractionStepsWithActionHandlers = [
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
              answerActions: "complex-test-action",
              answerActionsData: "red answer actions data",
              parentInteractionId: "new_1",
              isDeleted: false,
              interactionSteps: [
                {
                  id: "new_21",
                  questionText: "",
                  script: "Crimson is a rad shade of red, {firstName}",
                  answerOption: "Crimson",
                  answerActions: "complex-test-action",
                  answerActionsData: "crimson answer actions data",
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
            },
            {
              id: "new_4",
              questionText: "",
              script: "Blue is an awesome color, {firstName}!",
              answerOption: "Blue",
              answerActions: "complex-test-action",
              answerActionsData: "blue answer actions data",
              parentInteractionId: "new_1",
              isDeleted: false,
              interactionSteps: []
            }
          ]
        }
      ];
    });

    describe("happy path", () => {
      beforeEach(async () => {
        ({
          interactionSteps,
          redInteractionStep,
          shadesOfRedInteractionSteps,
          colorInteractionSteps
        } = await saveInteractionStepsAndSendInitialMessages(
          inputInteractionStepsWithoutActionHandlers,
          2
        ));

        questionResponses = [
          {
            campaignContactId: contacts[0].id,
            interactionStepId: interactionSteps[0].id,
            value: colorInteractionSteps[0].answerOption
          },
          {
            campaignContactId: contacts[0].id,
            interactionStepId: redInteractionStep.id,
            value: shadesOfRedInteractionSteps[0].answerOption
          }
        ];
      });

      beforeEach(async () => {
        jest.spyOn(cacheableData.campaignContact, "load");
        jest.spyOn(cacheableData.campaign, "load");
        jest.spyOn(errors, "assignmentRequiredOrAdminRole");
        jest.spyOn(cacheableData.questionResponse, "save");
        jest.spyOn(ActionHandlers, "rawAllActionHandlers").mockReturnValue({});
      });

      it("delegates to its dependencies", async () => {
        await Mutations.updateQuestionResponses(
          undefined,
          { questionResponses, campaignContactId: contacts[0].id },
          { user: texterUser }
        );
        expect(cacheableData.campaignContact.load.mock.calls).toEqual([[1]]);
        expect(cacheableData.campaign.load.mock.calls).toEqual([
          [contacts[0].id]
        ]);
        expect(errors.assignmentRequiredOrAdminRole.mock.calls).toEqual([
          [
            texterUser,
            Number(organization.id),
            Number(assignment.id),
            expect.objectContaining({ id: contacts[0].id })
          ]
        ]);
        expect(cacheableData.questionResponse.save.mock.calls).toEqual([
          [1, questionResponses]
        ]);

        expect(ActionHandlers.rawAllActionHandlers).toHaveBeenCalledTimes(1);
      });
    });

    describe("when some of the steps have an action handler", async () => {
      beforeEach(async () => {
        expect.extend({
          objectWithId: (received, expectedObject) => {
            let pass = false;
            if (
              received &&
              received.id &&
              expectedObject &&
              expectedObject.id
            ) {
              pass = Number(received.id) === Number(expectedObject.id);
            }
            const message = pass ? "ok" : "fail";
            return {
              message,
              pass
            };
          }
        });

        ({
          interactionSteps,
          redInteractionStep,
          shadesOfRedInteractionSteps,
          colorInteractionSteps
        } = await saveInteractionStepsAndSendInitialMessages(
          inputInteractionStepsWithActionHandlers,
          2
        ));

        questionResponses = [
          {
            campaignContactId: contacts[0].id,
            interactionStepId: interactionSteps[0].id,
            value: colorInteractionSteps[0].answerOption
          },
          {
            campaignContactId: contacts[0].id,
            interactionStepId: redInteractionStep.id,
            value: shadesOfRedInteractionSteps[0].answerOption
          }
        ];
      });

      it("delegates to its dependencies", async () => {
        jest.spyOn(ActionHandlers, "rawAllActionHandlers");
        jest.spyOn(cacheableData.organization, "load");
        jest.spyOn(ActionHandlers, "getActionHandler");
        jest.spyOn(ComplexTestActionHandler, "processAction");

        await Mutations.updateQuestionResponses(
          undefined,
          { questionResponses, campaignContactId: contacts[0].id },
          { loaders, user: texterUser }
        );

        await sleep(100);

        expect(ActionHandlers.rawAllActionHandlers).toHaveBeenCalledTimes(1);
        expect(ActionHandlers.rawAllActionHandlers.mock.results).toEqual([
          {
            isThrow: false,
            value: {
              "complex-test-action": expect.objectContaining({
                name: "complex-test-action"
              }),
              "test-action": expect.objectContaining({
                name: "test-action"
              })
            }
          }
        ]);

        expect(cacheableData.organization.load.mock.calls).toEqual([
          [Number(organization.id)]
        ]);

        expect(ComplexTestActionHandler.processAction).toHaveBeenCalledTimes(2);
        expect(ComplexTestActionHandler.processAction.mock.calls).toEqual(
          expect.arrayContaining([
            [
              {
                questionResponse: expect.objectContaining(questionResponses[0]),
                interactionStep: expect.objectWithId(colorInteractionSteps[0]),
                campaignContactId: Number(contacts[0].id),
                contact: expect.objectWithId(contacts[0]),
                campaign: expect.objectWithId(campaign),
                organization: expect.objectWithId(organization),
                previousValue: null
              }
            ],
            [
              {
                questionResponse: expect.objectContaining(questionResponses[1]),
                interactionStep: expect.objectWithId(
                  shadesOfRedInteractionSteps[0]
                ),
                campaignContactId: Number(contacts[0].id),
                contact: expect.objectWithId(contacts[0]),
                campaign: expect.objectWithId(campaign),
                organization: expect.objectWithId(organization),
                previousValue: null
              }
            ]
          ])
        );
      });

      describe("when a response is added", () => {
        beforeEach(async () => {
          questionResponses = [
            {
              campaignContactId: contacts[0].id,
              interactionStepId: interactionSteps[0].id,
              value: colorInteractionSteps[0].answerOption
            },
            {
              campaignContactId: contacts[0].id,
              interactionStepId: redInteractionStep.id,
              value: shadesOfRedInteractionSteps[0].answerOption
            }
          ];

          await Mutations.updateQuestionResponses(
            undefined,
            {
              questionResponses: [questionResponses[0]],
              campaignContactId: contacts[0].id
            },
            { loaders, user: texterUser }
          );

          jest.spyOn(ComplexTestActionHandler, "processAction");
          jest.spyOn(
            ComplexTestActionHandler,
            "processDeletedQuestionResponse"
          );
        });

        it("calls the action handler for the new response", async () => {
          await Mutations.updateQuestionResponses(
            undefined,
            { questionResponses, campaignContactId: contacts[0].id },
            { loaders, user: texterUser }
          );

          await sleep(100);

          expect(
            ComplexTestActionHandler.processDeletedQuestionResponse
          ).not.toHaveBeenCalled();

          expect(ComplexTestActionHandler.processAction).toHaveBeenCalled();

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0]
              .questionResponse
          ).toEqual(questionResponses[1]);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0].interactionStep.id.toString()
          ).toEqual(shadesOfRedInteractionSteps[0].id);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0]
              .campaignContactId
          ).toEqual(contacts[0].id);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0].contact.id
          ).toEqual(contacts[0].id);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0].campaign.id.toString()
          ).toEqual(campaign.id);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0].organization.id.toString()
          ).toEqual(organization.id);

          expect(
            ComplexTestActionHandler.processAction.mock.calls[0][0]
              .previousValue
          ).toBeNull();
        });
      });

      describe("when responses are added, resubmitted with no change, updated, and deleted", () => {
        beforeEach(async () => {
          questionResponses = [
            {
              campaignContactId: contacts[0].id,
              interactionStepId: interactionSteps[0].id,
              value: colorInteractionSteps[0].answerOption
            },
            {
              campaignContactId: contacts[0].id,
              interactionStepId: redInteractionStep.id,
              value: shadesOfRedInteractionSteps[0].answerOption
            }
          ];

          await Mutations.updateQuestionResponses(
            undefined,
            {
              questionResponses,
              campaignContactId: contacts[0].id
            },
            { loaders, user: texterUser }
          );

          jest.spyOn(ComplexTestActionHandler, "processAction");
          jest.spyOn(
            ComplexTestActionHandler,
            "processDeletedQuestionResponse"
          );
        });

        describe("when one of the question responses has already been saved with the same value", () => {
          it("calls processAction for the new question response", async () => {
            await Mutations.updateQuestionResponses(
              undefined,
              { questionResponses, campaignContactId: contacts[0].id },
              { loaders, user: texterUser }
            );

            await sleep(100);

            expect(
              ComplexTestActionHandler.processAction
            ).not.toHaveBeenCalled();
            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse
            ).not.toHaveBeenCalled();
          });
        });

        describe("when one of the question responses was updated", () => {
          beforeEach(async () => {
            questionResponses[0].value = "Blue";
          });

          it("calls processAction for for the updated response, and it passes in previousValue", async () => {
            await Mutations.updateQuestionResponses(
              undefined,
              { questionResponses, campaignContactId: contacts[0].id },
              { loaders, user: texterUser }
            );

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse
            ).not.toHaveBeenCalled();
            expect(ComplexTestActionHandler.processAction.mock.calls).toEqual(
              expect.arrayContaining([
                [
                  expect.objectContaining({
                    questionResponse: expect.objectContaining(
                      questionResponses[0]
                    ),
                    interactionStep: expect.objectWithId(
                      colorInteractionSteps[2]
                    ),
                    campaignContactId: Number(contacts[0].id),
                    contact: expect.objectWithId(contacts[0]),
                    campaign: expect.objectWithId(campaign),
                    organization: expect.objectWithId(organization),
                    previousValue: "Red"
                  })
                ]
              ])
            );
          });
        });

        describe("when one of the question responses is deleted", () => {
          it("calls processDeletedQuestionResponse", async () => {
            await Mutations.updateQuestionResponses(
              undefined,
              {
                questionResponses: [questionResponses[0]],
                campaignContactId: contacts[0].id
              },
              { loaders, user: texterUser }
            );

            expect(
              ComplexTestActionHandler.processAction
            ).not.toHaveBeenCalled();

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse
            ).toHaveBeenCalled();

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock
                .calls[0][0].questionResponse
            ).toEqual(questionResponses[1]);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock.calls[0][0].interactionStep.id.toString()
            ).toEqual(shadesOfRedInteractionSteps[0].id);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock
                .calls[0][0].campaignContactId
            ).toEqual(contacts[0].id);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock
                .calls[0][0].contact.id
            ).toEqual(contacts[0].id);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock.calls[0][0].campaign.id.toString()
            ).toEqual(campaign.id);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock.calls[0][0].organization.id.toString()
            ).toEqual(organization.id);

            expect(
              ComplexTestActionHandler.processDeletedQuestionResponse.mock
                .calls[0][0].previousValue
            ).toEqual("Crimson");
          });
        });
      });

      describe("when no action handlers are configured", async () => {
        beforeEach(async () => {
          ({
            interactionSteps,
            redInteractionStep,
            shadesOfRedInteractionSteps,
            colorInteractionSteps
          } = await saveInteractionStepsAndSendInitialMessages(
            inputInteractionStepsWithActionHandlers,
            2
          ));
        });

        it("exits early and logs an error", async () => {
          jest
            .spyOn(ActionHandlers, "rawAllActionHandlers")
            .mockReturnValue({});
          jest.spyOn(cacheableData.organization, "load");

          await Mutations.updateQuestionResponses(
            undefined,
            { questionResponses, campaignContactId: contacts[0].id },
            { loaders, user: texterUser }
          );

          expect(cacheableData.organization.load).not.toHaveBeenCalled();
        });
      });

      describe("when task dispatch fails", () => {
        beforeEach(async () => {
          ({
            interactionSteps,
            redInteractionStep,
            shadesOfRedInteractionSteps,
            colorInteractionSteps
          } = await saveInteractionStepsAndSendInitialMessages(
            inputInteractionStepsWithActionHandlers,
            2
          ));
        });

        it("dispatches other actions", async () => {
          jest.spyOn(ComplexTestActionHandler, "processAction");
          jest.spyOn(jobRunner, "dispatchTask").mockImplementationOnce(() => {
            throw new Error("foo");
          });
          await Mutations.updateQuestionResponses(
            {},
            { questionResponses, campaignContactId: contacts[0].id },
            { loaders, user: texterUser }
          );

          await sleep(100);

          expect(ComplexTestActionHandler.processAction).toHaveBeenCalledTimes(
            1
          );
          expect(ComplexTestActionHandler.processAction.mock.calls).toEqual([
            [
              {
                questionResponse: expect.objectContaining(questionResponses[1]),
                interactionStep: expect.objectWithId(
                  shadesOfRedInteractionSteps[0]
                ),
                campaignContactId: Number(contacts[0].id),
                contact: expect.objectWithId(contacts[0]),
                campaign: expect.objectWithId(campaign),
                organization: expect.objectWithId(organization),
                previousValue: null
              }
            ]
          ]);
        });
      });

      describe("when the action handler throws an exception", () => {
        beforeEach(async () => {
          ({
            interactionSteps,
            redInteractionStep,
            shadesOfRedInteractionSteps,
            colorInteractionSteps
          } = await saveInteractionStepsAndSendInitialMessages(
            inputInteractionStepsWithActionHandlers,
            2
          ));
        });

        it("processes the other actions", async () => {
          jest
            .spyOn(ComplexTestActionHandler, "processAction")
            .mockRejectedValueOnce(new Error("oh no"));
          jest.spyOn(cacheableData.organization, "load");

          await Mutations.updateQuestionResponses(
            {},
            { questionResponses, campaignContactId: contacts[0].id },
            { loaders, user: texterUser }
          );

          await sleep(100);
          expect(cacheableData.organization.load).toHaveBeenCalledTimes(1);

          expect(ComplexTestActionHandler.processAction).toHaveBeenCalledTimes(
            2
          );
          expect(ComplexTestActionHandler.processAction.mock.calls).toEqual(
            expect.arrayContaining([
              [
                {
                  questionResponse: expect.objectContaining(
                    questionResponses[0]
                  ),
                  interactionStep: expect.objectWithId(
                    colorInteractionSteps[0]
                  ),
                  campaignContactId: Number(contacts[0].id),
                  contact: expect.objectWithId(contacts[0]),
                  campaign: expect.objectWithId(campaign),
                  organization: expect.objectWithId(organization),
                  previousValue: null
                }
              ],
              [
                {
                  questionResponse: expect.objectContaining(
                    questionResponses[1]
                  ),
                  interactionStep: expect.objectWithId(
                    shadesOfRedInteractionSteps[0]
                  ),
                  campaignContactId: Number(contacts[0].id),
                  contact: expect.objectWithId(contacts[0]),
                  campaign: expect.objectWithId(campaign),
                  organization: expect.objectWithId(organization),
                  previousValue: null
                }
              ]
            ])
          );
        });
      });
    });
  });
});
