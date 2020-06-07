/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { r } from "../../src/server/models";
import { StyleSheetTestUtils } from "aphrodite";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { Card, CardHeader } from "material-ui/Card";
import CampaignInteractionStepsForm from "../../src/components/CampaignInteractionStepsForm";
import CampaignFormSectionHeading from "../../src/components/CampaignFormSectionHeading";
import {
  AdminCampaignEdit,
  operations as adminCampaignEditOps
} from "../../src/containers/AdminCampaignEdit";
import {
  setupTest,
  cleanupTest,
  createStartedCampaign,
  makeRunnableMutations,
  runComponentQueries
} from "../test_helpers";

describe("CampaignInteractionStepsForm", () => {
  describe("basic instantiation", function t() {
    let wrappedComponent;
    let component;
    const getInteractionSteps = () =>
      JSON.parse(
        '[{"id":"3237","questionText":"Disposition","script":"Hi {firstName}, is {texterFirstName} with WI Working Families! I’m making sure you got the word about our next event! Please join us tomorrow July 11 for a #WFP2020 presidential meet & greet happy hour with Julián Castro at 7pm in Milwaukee! Will you join, {firstName}?","answerOption":"Initial Message","answerActions":"","parentInteractionId":null,"isDeleted":false},{"id":"3238","questionText":"SMS Ask","script":"Fantastic! Advanced registration is required! Please RSVP at https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Yes","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3239","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3238","isDeleted":false},{"id":"3240","questionText":"SMS Ask","script":"I hope you can {firstName}! This is a great chance to get to know Julián and our #WFP2020 process! Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Maybe","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3241","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3240","isDeleted":false},{"id":"3242","questionText":"SMS Ask","script":"No worries, {firstName}! We can keep you updated on events and ways to make local change through updates from WFP via text. Opt in by replying YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Cannot Attend This Time","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3243","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3242","isDeleted":false},{"id":"3244","questionText":"","script":"OK. Thank you for your time. \\nNonsupporter of the candidate\\nJulián Castro is one of six candidates being considered for endorsement. The WFP endorsement process involves the membership, so we create opportunities for voters to meet, speak with, and ask hard questions of the candidates or their surrogates. Would you like to attend tonight?","answerOption":"Nonsupporter of WFP","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3245","questionText":"","script":"Thank you for letting me know. We really appreciate your past support. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No longer interested, non opt out","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3246","questionText":"In District?","script":"Thank you for letting me know! We will update our records. If you are in the Milwaukee area, would you like to attend our event?","answerOption":"Wrong # default ","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3247","questionText":"SMS Ask","script":"I hope you can! We will be at Working Families Party HQ from 7-830pm. Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Yes/Maybe","answerActions":"","parentInteractionId":"3246","isDeleted":false},{"id":"3248","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3247","isDeleted":false},{"id":"3249","questionText":"","script":"Thank you for getting back to me. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No - any reason","answerActions":"","parentInteractionId":"3246","isDeleted":false},{"id":"3250","questionText":"SMS Ask","script":"Thank you for letting me know! We will update our records. We will be at Working Families Party HQ from 7pm. Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply","answerOption":"Wrong # interested","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3251","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3250","isDeleted":false},{"id":"3252","questionText":"Zip Ask","script":"Thank you for letting me know. If I may get your zip code, I can update our records so you will get relevant action alerts.","answerOption":"Moved - NOT FOR WRONG #s","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3253","questionText":"SMS Ask","script":"Thank you! I will make sure that gets updated. Want to get updates relevant to your location from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Provides zip","answerActions":"","parentInteractionId":"3252","isDeleted":false},{"id":"3254","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3253","isDeleted":false},{"id":"3255","questionText":"","script":"Thank you for getting back to me. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No zip","answerActions":"","parentInteractionId":"3252","isDeleted":false},{"id":"3256","questionText":"","script":"I am so sorry to hear that, and will update our records. Please take good care.","answerOption":"Person died ","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3257","questionText":"","script":"Voy a notar que un organizador quien habla español debería comunicarse contigo pronto. ¡Gracias!","answerOption":"Spanish ","answerActions":"","parentInteractionId":"3237","isDeleted":false}]'
      );

    beforeEach(() => {
      StyleSheetTestUtils.suppressStyleInjection();
      wrappedComponent = mount(
        <MuiThemeProvider>
          <CampaignInteractionStepsForm
            formValues={{
              interactionSteps: getInteractionSteps()
            }}
            onChange={() => {}}
            onSubmit={() => {}}
            ensureComplete
            customFields={[]}
            saveLabel="save"
            errors={[]}
            availableActions={[]}
          />
        </MuiThemeProvider>
      );
      component = wrappedComponent.find(CampaignInteractionStepsForm);
    });

    afterEach(() => {
      wrappedComponent.unmount();
    });

    it("initializes state correctly", () => {
      expect(component.state().displayAllSteps).toEqual(true);
      expect(component.state().interactionSteps.length).toEqual(21);
    });

    it("has the correct heading", () => {
      const divs = component.find(CampaignFormSectionHeading).find("div");
      expect(divs.at(1).props().children).toEqual(
        "What do you want to discuss?"
      );
    });

    it("rendered the first interaction step", () => {
      const cards = component.find(Card);
      const card = cards.at(0);
      const cardHeader = card.find(CardHeader);
      expect(cardHeader.props().subtitle).toEqual(
        expect.stringMatching(/^Enter a script.*/)
      );

      const interactionSteps = getInteractionSteps();
      const scripts = component
        .findWhere(
          x => x.length && x.props()["data-test"] === "editorInteraction"
        )
        .hostNodes();
      expect(scripts.at(0).props().value).toEqual(interactionSteps[0].script);
    });

    it("rendered all the interaction steps", () => {
      const interactionSteps = getInteractionSteps().map(step => step.script);

      const scripts = component
        .findWhere(
          x => x.length && x.props()["data-test"] === "editorInteraction"
        )
        .hostNodes()
        .map(script => script.props().value);

      expect(interactionSteps.sort()).toEqual(scripts.sort());
    });
  });

  describe("action handlers", () => {
    let wrappedComponent;
    let interactionSteps;

    describe("when there are no action handlers", () => {
      beforeEach(async () => {
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

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <MuiThemeProvider>
            <CampaignInteractionStepsForm
              formValues={{
                interactionSteps
              }}
              onChange={() => {}}
              onSubmit={() => {}}
              ensureComplete
              customFields={[]}
              saveLabel="save"
              errors={[]}
              availableActions={[]}
            />
          </MuiThemeProvider>
        );
      });

      it("doesn't render the answer actions", async () => {
        const answerActionsComponents = wrappedComponent.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );
        expect(answerActionsComponents.exists()).toEqual(false);
      });
    });

    describe("when there are action handlers and no answerActionsData", () => {
      beforeEach(async () => {
        interactionSteps = [
          {
            id: 1,
            questionText: "What is your favorite color",
            script: "Hello {firstName}. Let's talk about your favorite color.",
            answerOption: "",
            answerActions: "",
            answerActionsData: null,
            parentInteractionId: null,
            isDeleted: false
          },
          {
            id: 2,
            questionText: "",
            script: "Red is an awesome color, {firstName}!",
            answerOption: "Red",
            answerActionsData: null,
            answerActions: "red-handler",
            parentInteractionId: 1,
            isDeleted: false
          },
          {
            id: 3,
            questionText: "",
            script: "Purple is an awesome color, {firstName}!",
            answerOption: "Purple",
            answerActions: "purple-handler",
            answerActionsData: null,
            parentInteractionId: 1,
            isDeleted: false
          },
          {
            id: 4,
            questionText: "",
            script: "Deep Pink is an awesome color, {firstName}!",
            answerOption: "Deep Pink",
            answerActions: "",
            answerActionsData: null,
            parentInteractionId: 1,
            isDeleted: false
          }
        ];

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <MuiThemeProvider>
            <CampaignInteractionStepsForm
              formValues={{
                interactionSteps
              }}
              onChange={() => {}}
              onSubmit={() => {}}
              ensureComplete
              customFields={[]}
              saveLabel="save"
              errors={[]}
              availableActions={[
                {
                  name: "red-handler",
                  displayName: "Red Action",
                  instructions: "red action instructions"
                },
                {
                  name: "purple-handler",
                  displayName: "Purple Action",
                  instructions: "purple action instructions"
                }
              ]}
            />
          </MuiThemeProvider>
        );
      });

      it("renders the answer actions", async () => {
        const cards = wrappedComponent.find(Card);
        expect(cards.exists()).toEqual(true);

        // FIRST STEP VALIDATION
        const step1 = cards.at(1);
        const step1AnswerActionNodes = step1.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step1AnswerActionNodes.last().props().value).toEqual(
          "red-handler"
        );

        expect(step1AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "red-handler",
            label: "Red Action"
          },
          {
            value: "purple-handler",
            label: "Purple Action"
          }
        ]);

        const step1ClientChoiceNodes = step1.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step1ClientChoiceNodes.exists()).toEqual(false);

        // SECOND STEP VALIDATION
        const step2 = cards.at(2);
        const step2AnswerActionNodes = step2.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step2AnswerActionNodes.last().props().value).toEqual(
          "purple-handler"
        );

        expect(step2AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "red-handler",
            label: "Red Action"
          },
          {
            value: "purple-handler",
            label: "Purple Action"
          }
        ]);

        const step2ClientChoiceNodes = step2.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step2ClientChoiceNodes.exists()).toEqual(false);

        // THIRD STEP VALIDATION
        const step3 = cards.at(3);
        const step3AnswerActionNodes = step3.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step3AnswerActionNodes.last().props().value).toEqual("");

        expect(step3AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "red-handler",
            label: "Red Action"
          },
          {
            value: "purple-handler",
            label: "Purple Action"
          }
        ]);

        const step3ClientChoiceNodes = step3.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step3ClientChoiceNodes.exists()).toEqual(false);
      });
    });

    describe("when there are action handlers and answerActionsData", () => {
      beforeEach(async () => {
        interactionSteps = [
          {
            id: 1,
            questionText: "What is your favorite color",
            script: "Hello {firstName}. Let's talk about your favorite color.",
            answerOption: "",
            answerActions: "",
            answerActionsData: null,
            parentInteractionId: null,
            isDeleted: false
          },
          {
            id: 2,
            questionText: "",
            script: "Red is an awesome color, {firstName}!",
            answerOption: "Red",
            answerActionsData: JSON.stringify({
              value: "#FF0000",
              label: "red"
            }),
            answerActions: "color-handler",
            parentInteractionId: 1,
            isDeleted: false
          },
          {
            id: 3,
            questionText: "",
            script: "Purple is an awesome color, {firstName}!",
            answerOption: "Purple",
            answerActions: "color-handler",
            answerActionsData: JSON.stringify({
              value: "#800080",
              label: "purple"
            }),
            parentInteractionId: 1,
            isDeleted: false
          },
          {
            id: 4,
            questionText: "",
            script: "Deep Pink is an awesome color, {firstName}!",
            answerOption: "Deep Pink",
            answerActions: "pink-handler",
            answerActionsData: null,
            parentInteractionId: 1,
            isDeleted: false
          },
          {
            id: 5,
            questionText: "",
            script: "That's too bad, {firstName}!",
            answerOption: "I don't have one",
            answerActions: "",
            answerActionsData: null,
            parentInteractionId: 1,
            isDeleted: false
          }
        ];

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <MuiThemeProvider>
            <CampaignInteractionStepsForm
              formValues={{
                interactionSteps
              }}
              onChange={() => {}}
              onSubmit={() => {}}
              ensureComplete
              customFields={[]}
              saveLabel="save"
              errors={[]}
              availableActions={[
                {
                  name: "color-handler",
                  displayName: "Color Action",
                  instructions: "color action instructions",
                  clientChoiceData: [
                    {
                      name: "red",
                      details: "#FF0000"
                    },
                    {
                      name: "purple",
                      details: "#800080"
                    },
                    {
                      name: "fuschsia",
                      details: "#FF00FF"
                    }
                  ]
                },
                {
                  name: "pink-handler",
                  displayName: "Pink Action",
                  instructions: "pink action instructions"
                }
              ]}
            />
          </MuiThemeProvider>
        );
      });

      it("renders the answer actions and answer-actions data", async () => {
        const cards = wrappedComponent.find(Card);
        expect(cards.exists()).toEqual(true);

        // FIRST STEP VALIDATION
        const step1 = cards.at(1);
        const step1AnswerActionNodes = step1.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step1AnswerActionNodes.last().props().value).toEqual(
          "color-handler"
        );

        expect(step1AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "color-handler",
            label: "Color Action"
          },
          {
            value: "pink-handler",
            label: "Pink Action"
          }
        ]);

        const step1ClientChoiceNodes = step1.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step1ClientChoiceNodes.last().props().value).toEqual({
          label: "red",
          value: "#FF0000"
        });

        expect(step1ClientChoiceNodes.last().props().choices).toEqual([
          {
            label: "red",
            value: "#FF0000"
          },
          {
            label: "purple",
            value: "#800080"
          },
          {
            label: "fuschsia",
            value: "#FF00FF"
          }
        ]);

        // SECOND STEP VALIDATION
        const step2 = cards.at(2);
        const step2AnswerActionNodes = step2.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step2AnswerActionNodes.last().props().value).toEqual(
          "color-handler"
        );

        expect(step2AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "color-handler",
            label: "Color Action"
          },
          {
            value: "pink-handler",
            label: "Pink Action"
          }
        ]);

        const step2ClientChoiceNodes = step2.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step2ClientChoiceNodes.last().props().value).toEqual({
          label: "purple",
          value: "#800080"
        });

        expect(step2ClientChoiceNodes.last().props().choices).toEqual([
          {
            label: "red",
            value: "#FF0000"
          },
          {
            label: "purple",
            value: "#800080"
          },
          {
            label: "fuschsia",
            value: "#FF00FF"
          }
        ]);

        // THIRD STEP VALIDATION
        const step3 = cards.at(3);
        const step3AnswerActionNodes = step3.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step3AnswerActionNodes.last().props().value).toEqual(
          "pink-handler"
        );

        expect(step3AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "color-handler",
            label: "Color Action"
          },
          {
            value: "pink-handler",
            label: "Pink Action"
          }
        ]);

        const step3ClientChoiceNodes = step3.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step3ClientChoiceNodes.exists()).toEqual(false);

        // FOURTH STEP VALIDATION
        const step4 = cards.at(4);
        const step4AnswerActionNodes = step4.findWhere(
          node => node.props()["data-test"] === "actionSelect"
        );

        expect(step4AnswerActionNodes.last().props().value).toEqual("");

        expect(step4AnswerActionNodes.last().props().choices).toEqual([
          {
            value: "color-handler",
            label: "Color Action"
          },
          {
            value: "pink-handler",
            label: "Pink Action"
          }
        ]);

        const step4ClientChoiceNodes = step4.findWhere(
          node => node.props()["data-test"] === "actionDataAutoComplete"
        );

        expect(step4ClientChoiceNodes.exists()).toEqual(false);
      });
    });

    describe("when CampaignInteractionStepsForm submits interaction steps through the editCampaign mutation", () => {
      let wrappedComponent;
      let adminUser;
      let campaign;
      let organization;
      let interactionSteps;
      let queryResults;

      beforeEach(async () => {
        await setupTest();

        const startedCampaign = await createStartedCampaign();
        ({
          testOrganization: {
            data: { createOrganization: organization }
          },
          testAdminUser: adminUser,
          testCampaign: campaign
        } = startedCampaign);
      }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

      afterEach(async () => {
        await cleanupTest();
      }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

      beforeEach(async () => {
        interactionSteps = [
          {
            id: "new_72",
            questionText: "What's your favorite color?",
            script: "Hi {firstName}!  Let's talk about colors.",
            answerOption: "",
            answerActions: "",
            answerActionsData: null,
            parentInteractionId: null,
            isDeleted: false
          },
          {
            id: "new_73",
            questionText: "What's your favorite shade of red?",
            script: "Red is a great color, {firstName}!",
            answerOption: "Red",
            answerActions: "complex-test-action",
            answerActionsData:
              '{"value":"{\\"hex\\":\\"#B22222\\",\\"rgb\\":{\\"r\\":178,\\"g\\":34,\\"b\\":34}}","label":"firebrick"}',
            parentInteractionId: "new_72",
            isDeleted: false
          },
          {
            id: "new_74",
            questionText: "",
            script: "Purple is a great color, {firstName}!",
            answerOption: "Purple",
            answerActions: "complex-test-action",
            answerActionsData:
              '{"value":"{\\"hex\\":\\"#4B0082\\",\\"rgb\\":{\\"r\\":75,\\"g\\":0,\\"b\\":130}}","label":"indigo"}',
            parentInteractionId: "new_72",
            isDeleted: false
          },
          {
            id: "new_75",
            questionText: "",
            script: "Crimson is a great shade of red, {firstName}!",
            answerOption: "Crimson",
            answerActions: "",
            answerActionsData: "",
            parentInteractionId: "new_73",
            isDeleted: false
          },
          {
            id: "new_76",
            questionText: "",
            script: "Cherry is a great shade of red, {firstName}!",
            answerOption: "Cherry",
            answerActions: "",
            answerActionsData: "",
            parentInteractionId: "new_73",
            isDeleted: false
          }
        ];

        const params = {
          campaignId: campaign.id,
          organizationId: organization.id,
          adminPerms: true
        };

        const ownProps = {
          params: {
            ...params
          }
        };

        queryResults = await runComponentQueries(
          adminCampaignEditOps.queries,
          adminUser,
          ownProps
        );

        const wrappedMutations = makeRunnableMutations(
          adminCampaignEditOps.mutations,
          adminUser,
          ownProps
        );

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <MuiThemeProvider>
            <AdminCampaignEdit
              {...queryResults}
              mutations={wrappedMutations}
              params={params}
              location={{
                query: {
                  new: true
                }
              }}
            />
          </MuiThemeProvider>
        );
      });

      it("saves the interaction steps with onSave is invoked", async done => {
        expect(wrappedComponent.exists()).toEqual(true);
        const interactionStepsBefore = await r
          .knex("interaction_step")
          .where({ campaign_id: campaign.id });

        expect(interactionStepsBefore).toHaveLength(0);

        return wrappedComponent
          .children()
          .first()
          .setState(
            {
              expandedSection: 3,
              campaignFormValues: {
                ...queryResults.campaignData.campaign,
                interactionSteps
              }
            },
            async () => {
              const campaignInteractionStepsForm = wrappedComponent.find(
                CampaignInteractionStepsForm
              );

              expect(campaignInteractionStepsForm.exists()).toEqual(true);

              const instance = campaignInteractionStepsForm.instance();

              await instance.onSave();

              const interactionStepsAfter = await r
                .knex("interaction_step")
                .where({ campaign_id: campaign.id });

              interactionStepsAfter.forEach(step => {
                // eslint-disable-next-line no-param-reassign
                step.is_deleted = !!step.is_deleted;
              });

              expect(interactionStepsAfter).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    answer_actions: "",
                    answer_actions_data: null,
                    answer_option: "",
                    campaign_id: Number(campaign.id),
                    id: expect.any(Number),
                    is_deleted: false,
                    parent_interaction_id: null,
                    question: "What's your favorite color?",
                    script: "Hi {firstName}!  Let's talk about colors."
                  }),
                  expect.objectContaining({
                    answer_actions: "complex-test-action",
                    answer_actions_data:
                      '{"value":"{\\"hex\\":\\"#B22222\\",\\"rgb\\":{\\"r\\":178,\\"g\\":34,\\"b\\":34}}","label":"firebrick"}',
                    answer_option: "Red",
                    id: expect.any(Number),
                    campaign_id: Number(campaign.id),
                    is_deleted: false,
                    parent_interaction_id: expect.any(Number),
                    question: "What's your favorite shade of red?",
                    script: "Red is a great color, {firstName}!"
                  }),
                  expect.objectContaining({
                    answer_actions: "",
                    answer_actions_data: "",
                    answer_option: "Crimson",
                    campaign_id: Number(campaign.id),
                    id: expect.any(Number),
                    is_deleted: false,
                    parent_interaction_id: expect.any(Number),
                    question: "",
                    script: "Crimson is a great shade of red, {firstName}!"
                  }),
                  expect.objectContaining({
                    answer_actions: "",
                    answer_actions_data: "",
                    answer_option: "Cherry",
                    campaign_id: Number(campaign.id),
                    id: expect.any(Number),
                    is_deleted: false,
                    parent_interaction_id: expect.any(Number),
                    question: "",
                    script: "Cherry is a great shade of red, {firstName}!"
                  }),
                  expect.objectContaining({
                    answer_actions: "complex-test-action",
                    answer_actions_data:
                      '{"value":"{\\"hex\\":\\"#4B0082\\",\\"rgb\\":{\\"r\\":75,\\"g\\":0,\\"b\\":130}}","label":"indigo"}',
                    answer_option: "Purple",
                    campaign_id: Number(campaign.id),
                    id: expect.any(Number),
                    is_deleted: false,
                    parent_interaction_id: expect.any(Number),
                    question: "",
                    script: "Purple is a great color, {firstName}!"
                  })
                ])
              );

              done();
            }
          );
      });
    });
  });
});
