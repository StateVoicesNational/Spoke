import React from "react";
import { shallow } from "enzyme";
import Survey from "../../../src/components/AssignmentTexter/Survey";

describe("Survey component", () => {
  const questionResponses = {};
  const currentInteractionStep = {
    id: 1,
    question: {
      id: 1,
      text: "What is foo?",
      answerOptions: [
        {
          value: "Foo is an animal",
          interactionStepId: 3,
          nextInteractionStep: { script: "foo" }
        }
      ]
    }
  };
  const interactionSteps = [currentInteractionStep];

  const wrapper = shallow(
    <Survey
      questionResponses={questionResponses}
      interactionSteps={interactionSteps}
      currentInteractionStep={currentInteractionStep}
    />
  );

  test("Renders Card Header and CardText", () => {
    const cardHeader = wrapper.find("CardHeader");
    const cardText = wrapper.find("CardText").at(0);

    expect(cardHeader.prop("showExpandableButton")).toBe(false);
    expect(cardText.childAt(0).text()).toBe("<SelectField />");
  });

  test("handleExpandChange Function", () => {
    expect(wrapper.state().showAllQuestions).toEqual(false);
    wrapper.instance().handleExpandChange(true);
    expect(wrapper.state().showAllQuestions).toEqual(true);
  });

  test("getNextScript Function", () => {
    expect(
      wrapper.instance().getNextScript({
        interactionStep: currentInteractionStep,
        answerIndex: 0
      })
    ).toBe("foo");
  });
});
