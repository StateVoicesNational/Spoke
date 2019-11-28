/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { Card, CardHeader, CardActions, CardTitle } from "material-ui/Card";
import CampaignInteractionStepsForm from "../../src/components/CampaignInteractionStepsForm";
import CampaignFormSectionHeading from "../../src/components/CampaignFormSectionHeading";

import Form from "react-formal";
import GSForm from "../../src/components/forms/GSForm";
import GSScriptField from "../../src/components/forms/GSScriptField";

const getInteractionSteps = () =>
  JSON.parse(
    '[{"id":"3237","questionText":"Disposition","script":"Hi {firstName}, this is {texterFirstName} with WI Working Families! I’m making sure you got the word about our next event! Please join us tomorrow July 11 for a #WFP2020 presidential meet & greet happy hour with Julián Castro at 7pm in Milwaukee! Will you join, {firstName}?","answerOption":"Initial Message","answerActions":"","parentInteractionId":null,"isDeleted":false},{"id":"3238","questionText":"SMS Ask","script":"Fantastic! Advanced registration is required! Please RSVP at https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Yes","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3239","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3238","isDeleted":false},{"id":"3240","questionText":"SMS Ask","script":"I hope you can {firstName}! This is a great chance to get to know Julián and our #WFP2020 process! Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Maybe","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3241","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3240","isDeleted":false},{"id":"3242","questionText":"SMS Ask","script":"No worries, {firstName}! We can keep you updated on events and ways to make local change through updates from WFP via text. Opt in by replying YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Cannot Attend This Time","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3243","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3242","isDeleted":false},{"id":"3244","questionText":"","script":"OK. Thank you for your time. \\nNonsupporter of the candidate\\nJulián Castro is one of six candidates being considered for endorsement. The WFP endorsement process involves the membership, so we create opportunities for voters to meet, speak with, and ask hard questions of the candidates or their surrogates. Would you like to attend tonight?","answerOption":"Nonsupporter of WFP","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3245","questionText":"","script":"Thank you for letting me know. We really appreciate your past support. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No longer interested, non opt out","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3246","questionText":"In District?","script":"Thank you for letting me know! We will update our records. If you are in the Milwaukee area, would you like to attend our event?","answerOption":"Wrong # default ","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3247","questionText":"SMS Ask","script":"I hope you can! We will be at Working Families Party HQ from 7-830pm. Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want to get updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Yes/Maybe","answerActions":"","parentInteractionId":"3246","isDeleted":false},{"id":"3248","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3247","isDeleted":false},{"id":"3249","questionText":"","script":"Thank you for getting back to me. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No - any reason","answerActions":"","parentInteractionId":"3246","isDeleted":false},{"id":"3250","questionText":"SMS Ask","script":"Thank you for letting me know! We will update our records. We will be at Working Families Party HQ from 7pm. Please RSVP here and an organizer will be in touch to answer any questions -- https://wfpus.org/2S5dJq0 and make sure to tell your friends and family about the event too! Want updates from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply","answerOption":"Wrong # interested","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3251","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3250","isDeleted":false},{"id":"3252","questionText":"Zip Ask","script":"Thank you for letting me know. If I may get your zip code, I can update our records so you will get relevant action alerts.","answerOption":"Moved - NOT FOR WRONG #s","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3253","questionText":"SMS Ask","script":"Thank you! I will make sure that gets updated. Want to get updates relevant to your location from WFP via text? Reply YES to confirm & start receiving mobile updates from 738674. Msg & data rates may apply.","answerOption":"Provides zip","answerActions":"","parentInteractionId":"3252","isDeleted":false},{"id":"3254","questionText":"","script":"Thank you for joining! Check out our website http://workingfamilies.org for more information about our work.","answerOption":"SMS Yes","answerActions":"","parentInteractionId":"3253","isDeleted":false},{"id":"3255","questionText":"","script":"Thank you for getting back to me. You can always get updates by texting WFP2020 to 738674 or join a volunteer team online at www.WFP4theMany.org ","answerOption":"No zip","answerActions":"","parentInteractionId":"3252","isDeleted":false},{"id":"3256","questionText":"","script":"I am so sorry to hear that, and will update our records. Please take good care.","answerOption":"Person died ","answerActions":"","parentInteractionId":"3237","isDeleted":false},{"id":"3257","questionText":"","script":"Voy a notar que un organizador quien habla español debería comunicarse contigo pronto. ¡Gracias!","answerOption":"Spanish ","answerActions":"","parentInteractionId":"3237","isDeleted":false}]'
  );

describe("AssignmentSummary text", function t() {
  beforeEach(() => {
    StyleSheetTestUtils.suppressStyleInjection();
    this.wrappedComponent = mount(
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
    this.component = this.wrappedComponent.find(CampaignInteractionStepsForm);
  });

  afterEach(() => {
    this.wrappedComponent.unmount();
  });

  it("initializes state correctly", () => {
    expect(this.component.state().displayAllSteps).toBe(true);
    expect(this.component.state().interactionSteps.length).toBe(21);
  });

  it("has the correct heading", () => {
    const divs = this.component.find(CampaignFormSectionHeading).find("div");
    expect(divs.at(1).props().children).toEqual("What do you want to discuss?");
  });

  it("rendered the first interaction step", () => {
    const cards = this.component.find(Card);
    const card = cards.at(0);
    const cardHeader = card.find(CardHeader);
    expect(cardHeader.props().subtitle).toEqual(
      expect.stringMatching(/^Enter a script.*/)
    );

    const interactionSteps = getInteractionSteps();
    const scripts = this.component.findWhere(
      x =>
        x.length &&
        x.props()["data-test"] === "editorInteraction" &&
        x.debug().startsWith("<input")
    );
    expect(scripts.at(0).props().value).toEqual(interactionSteps[0].script);
  });

  it("rendered all the interaction steps", () => {
    const interactionSteps = getInteractionSteps().map(step => step.script);

    const scripts = this.component
      .findWhere(
        x =>
          x.length &&
          x.props()["data-test"] === "editorInteraction" &&
          x.debug().startsWith("<input")
      )
      .map(script => script.props().value);

    expect(interactionSteps.sort()).toEqual(scripts.sort());
  });
});
