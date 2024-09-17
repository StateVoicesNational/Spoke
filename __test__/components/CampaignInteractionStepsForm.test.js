/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { r } from "../../src/server/models";
import { StyleSheetTestUtils } from "aphrodite";

import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";

import GSSelectField from "../../src/components/forms/GSSelectField";
import GSScriptField from "../../src/components/forms/GSScriptField";
import { CampaignInteractionStepsFormBase as CampaignInteractionStepsForm } from "../../src/components/CampaignInteractionStepsForm";
import CampaignFormSectionHeading from "../../src/components/CampaignFormSectionHeading";
import {
  AdminCampaignEditBase as AdminCampaignEdit,
  operations as adminCampaignEditOps
} from "../../src/containers/AdminCampaignEdit";
import {
  mockInteractionSteps,
  setupTest,
  cleanupTest,
  createCampaign,
  createInvite,
  createOrganization,
  createUser,
  makeRunnableMutations,
  runComponentQueries,
  muiTheme
} from "../test_helpers";
import ThemeContext from "../../src/containers/context/ThemeContext";

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
        <ThemeContext.Provider value={{ muiTheme }}>
          <CampaignInteractionStepsForm
            muiTheme={muiTheme}
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
        </ThemeContext.Provider>
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
      const scripts = component.find(GSScriptField);

      expect(scripts.at(0).props().value).toEqual(interactionSteps[0].script);
    });

    it("rendered all the interaction steps", () => {
      const interactionSteps = getInteractionSteps().map(step => step.script);
      const scripts = component.find(GSScriptField).map(c => c.props().value);

      expect(interactionSteps.sort()).toEqual(scripts.sort());
    });
  });

  describe("action handlers", () => {
    const pinkInteractionStep = {
      id: 4,
      questionText: "",
      script: "Deep Pink is an awesome color, {firstName}!",
      answerOption: "Deep Pink",
      answerActions: "",
      answerActionsData: null,
      parentInteractionId: 1,
      isDeleted: false
    };

    let wrappedComponent;
    let interactionSteps;

    function cmpAnswerOptions(step) {
      return function(mStep) {
        /**
         * @returns True if the answer options are equal. False otherwise.
         */
        return step.answer_option === mStep.answerOption;
      };
    }

    function cmpProp(prop, val) {
      return function(node) {
        /**
         * @returns True if the node prop and val are equal. False otherwise.
         */
        return node.props()[prop] === val;
      };
    }

    function dummyFunction() {
      /**
       * Empty function that does nothing
       *
       * @returns Empty object
       */
      return {};
    }

    function saveInteractionSteps(
      campaign,
      done,
      interactionSteps,
      queryResults,
      wrappedComponent
    ) {
      const newInteractionSteps = [];
      let instance, interactionStepsAfter;

      async function callback1() {
        const campaignInteractionStepsForm = wrappedComponent.find(
          CampaignInteractionStepsForm
        );

        expect(campaignInteractionStepsForm.exists()).toEqual(true);

        instance = campaignInteractionStepsForm.instance();

        await instance.onSave();

        interactionStepsAfter = await r
          .knex("interaction_step")
          .where({ campaign_id: campaign.id });

        interactionStepsAfter.map(normalizeIsDeleted);

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

        // Delete "Red" interaction step
        wrappedComponent.setState(
          {
            expandedSection: 3
          },
          callback2
        );
      }

      async function callback2() {
        interactionStepsAfter.forEach(deleteRedInteractionSteps);

        instance.state.interactionSteps = newInteractionSteps;
        await instance.onSave();

        const interactionStepsAfterDelete = await r
          .knex("interaction_step")
          .where({ campaign_id: campaign.id });

        // Test that the "Red" interaction step and its children are deleted
        interactionStepsAfterDelete.map(normalizeIsDeleted);
        expect(interactionStepsAfterDelete).toEqual(
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

      function deleteRedInteractionSteps(step) {
        const newStep = JSON.parse(
          JSON.stringify(
            instance.state.interactionSteps.find(cmpAnswerOptions(step))
          )
        );

        newStep.id = step.id;
        newStep.parentInteractionId = step.parent_interaction_id;

        if (step.answer_option === "Red") {
          newStep.isDeleted = true;
        }

        newInteractionSteps.push(newStep);
      }

      /**
       * Normalize is_deleted field due to various possible truthy values in different databases types
       * @param {array} is Interaction steps
       */
      function normalizeIsDeleted(step) {
        // eslint-disable-next-line no-param-reassign
        step.is_deleted = !!step.is_deleted;
      }

      return function(interactionStepsBefore) {
        expect(interactionStepsBefore).toHaveLength(0);

        return wrappedComponent.setState(
          {
            expandedSection: 3,
            campaignFormValues: {
              ...queryResults.campaignData.campaign,
              interactionSteps
            }
          },
          callback1
        );
      };
    }

    describe("when there are no action handlers", () => {
      beforeEach(async () => {
        interactionSteps = [mockInteractionSteps];

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <ThemeContext.Provider value={{ muiTheme }}>
            <CampaignInteractionStepsForm
              muiTheme={muiTheme}
              formValues={{
                interactionSteps
              }}
              onChange={dummyFunction}
              onSubmit={dummyFunction}
              ensureComplete
              customFields={[]}
              saveLabel="save"
              errors={[]}
              availableActions={[]}
            />
          </ThemeContext.Provider>
        );
      });

      it("doesn't render the answer actions", async () => {
        const answerActionsComponents = wrappedComponent.findWhere(
          cmpProp("data-test", "actionSelect")
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
          { ...pinkInteractionStep }
        ];

        StyleSheetTestUtils.suppressStyleInjection();
        wrappedComponent = mount(
          <ThemeContext.Provider value={{ muiTheme }}>
            <CampaignInteractionStepsForm
              muiTheme={muiTheme}
              formValues={{
                interactionSteps
              }}
              onChange={dummyFunction}
              onSubmit={dummyFunction}
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
          </ThemeContext.Provider>
        );
      });

      it("renders the answer actions", async () => {
        const cards = wrappedComponent.find(Card);
        expect(cards.exists()).toEqual(true);

        // FIRST STEP VALIDATION
        const step1 = cards.at(1);
        const selectField1 = step1.find(GSSelectField);
        const step1AnswerActionNodes = step1.findWhere(
          cmpProp("data-test", "actionSelect")
        );
        expect(step1AnswerActionNodes.first().props().value).toEqual(
          "red-handler"
        );

        expect(selectField1.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
        );

        expect(step1ClientChoiceNodes.exists()).toEqual(false);

        // SECOND STEP VALIDATION
        const step2 = cards.at(2);
        const selectField2 = step2.find(GSSelectField);
        const step2AnswerActionNodes = step2.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step2AnswerActionNodes.first().props().value).toEqual(
          "purple-handler"
        );

        expect(selectField2.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
        );

        expect(step2ClientChoiceNodes.exists()).toEqual(false);

        // THIRD STEP VALIDATION
        const step3 = cards.at(3);
        const selectField3 = step3.find(GSSelectField);
        const step3AnswerActionNodes = step3.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step3AnswerActionNodes.first().props().value).toEqual("");

        expect(selectField3.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
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
          { ...pinkInteractionStep, answerActions: "pink-handler" },
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
          <ThemeContext.Provider value={{ muiTheme }}>
            <CampaignInteractionStepsForm
              muiTheme={muiTheme}
              formValues={{
                interactionSteps
              }}
              onChange={dummyFunction}
              onSubmit={dummyFunction}
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
          </ThemeContext.Provider>
        );
      });

      it("renders the answer actions and answer-actions data", async () => {
        const cards = wrappedComponent.find(Card);
        expect(cards.exists()).toEqual(true);

        // FIRST STEP VALIDATION
        const step1 = cards.at(1);
        const selectField1 = step1.find(GSSelectField);
        const step1AnswerActionNodes = step1.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step1AnswerActionNodes.first().props().value).toEqual(
          "color-handler"
        );

        expect(selectField1.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
        );

        expect(step1ClientChoiceNodes.at(2).props().options).toEqual([
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
        const selectField2 = step2.find(GSSelectField);
        const step2AnswerActionNodes = step2.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step2AnswerActionNodes.first().props().value).toEqual(
          "color-handler"
        );

        expect(selectField2.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
        );

        expect(step2ClientChoiceNodes.first().props().value).toEqual({
          label: "purple",
          value: "#800080"
        });

        expect(step2ClientChoiceNodes.first().props().options).toEqual([
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
        const selectField3 = step3.find(GSSelectField);
        const step3AnswerActionNodes = step3.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step3AnswerActionNodes.first().props().value).toEqual(
          "pink-handler"
        );

        expect(selectField3.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
        );

        expect(step3ClientChoiceNodes.exists()).toEqual(false);

        // FOURTH STEP VALIDATION
        const step4 = cards.at(4);
        const selectField4 = step4.find(GSSelectField);
        const step4AnswerActionNodes = step4.findWhere(
          cmpProp("data-test", "actionSelect")
        );

        expect(step4AnswerActionNodes.first().props().value).toEqual("");

        expect(selectField4.props().choices).toEqual([
          {
            value: "",
            label: "None"
          },
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
          cmpProp("data-test", "actionDataAutoComplete")
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

        adminUser = await createUser();
        const testOrganization = await createOrganization(
          adminUser,
          await createInvite()
        );
        campaign = await createCampaign(adminUser, testOrganization);
        organization = testOrganization.data.createOrganization;
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
          <ThemeContext.Provider value={{ muiTheme }}>
            <AdminCampaignEdit
              {...queryResults}
              mutations={wrappedMutations}
              params={params}
              location={{
                query: {}
              }}
              muiTheme={muiTheme}
            />
          </ThemeContext.Provider>
        );
      });

      it("saves the interaction steps with onSave is invoked", done => {
        expect(wrappedComponent.exists()).toEqual(true);
        r.knex("interaction_step")
          .where({ campaign_id: campaign.id })
          .then(
            saveInteractionSteps(
              campaign,
              done,
              interactionSteps,
              queryResults,
              wrappedComponent
            )
          );
      });
    });
  });
});
