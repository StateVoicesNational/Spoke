import React from "react";
import { shallow } from "enzyme";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
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
        },
        {
          value: "Foo is a mineral",
          interactionStepId: 3,
          nextInteractionStep: { script: "bar" }
        },
        {
          value: "Foo is a vegetable",
          interactionStepId: 3,
          nextInteractionStep: { script: "fizz" }
        }
      ],
      filteredAnswerOptions: [
        {
          value: "Foo is a mineral",
          interactionStepId: 3,
          nextInteractionStep: { script: "bar" }
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

  test("Accordion started open with correct text", () => {
    const accordion = wrapper.find(Accordion);
    const accordionSummary = wrapper.find(AccordionSummary);
    const cardHeader = wrapper.find("CardHeader");
    const cardText = wrapper.find("CardText").at(0);

    expect(accordion.prop("expanded")).toBe(true);
    expect(accordionSummary.prop("children")).toContain("Current question");
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
    ).toBe("bar");
  });
});
