import React from "react";
import { shallow } from "enzyme";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import MenuItem from "@material-ui/core/MenuItem";
import ListItem from "@material-ui/core/ListItem";
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
          interactionStepId: 4,
          nextInteractionStep: { script: "bar" }
        },
        {
          value: "Foo is a vegetable",
          interactionStepId: 5,
          nextInteractionStep: { script: "fizz" }
        }
      ],
      filteredAnswerOptions: [
        {
          value: "Foo is a mineral",
          interactionStepId: 4,
          nextInteractionStep: { script: "bar" }
        }
      ]
    }
  };
  const secondStep = {
    id: 4,
    script: "bar",
    question: {
      text: "Is Foo bigger than a breadbox?",
      answerOptions: [
        {
          value: "Yes",
          interactionStepId: "100",
          nextInteractionStep: {
            id: "100",
            script: "Is it human-made?"
          }
        }
      ]
    }
  };
  const wrapper1 = shallow(
    <Survey
      questionResponses={questionResponses}
      interactionSteps={[currentInteractionStep]}
      currentInteractionStep={currentInteractionStep}
    />
  );

  const wrapper2 = shallow(
    <Survey
      questionResponses={questionResponses}
      interactionSteps={[currentInteractionStep, secondStep]}
      currentInteractionStep={currentInteractionStep}
    />
  );

  test("Accordion started closed with correct text", () => {
    const accordion = wrapper2.find(Accordion);
    const accordionSummary = wrapper2.find(AccordionSummary);
    const menuItem = wrapper2.find(MenuItem).at(1); // 2nd for mineral
    const listItems = wrapper2.find(ListItem);

    expect(accordion.prop("expanded")).toBe(false);
    expect(accordionSummary.prop("children")).toContain("All questions");
    expect(menuItem.prop("value")).toContain("Foo is a mineral");
    // filtered list includes mineral
    expect(
      listItems.findWhere(x => x.prop("value") === "Foo is a mineral").length
    ).toBe(1);
    // filtered list does NOT include vegetable
    expect(
      listItems.findWhere(x => x.prop("value") === "Foo is a vegetable").length
    ).toBe(0);
  });

  test("handleExpandChange Function", () => {
    expect(wrapper1.state().showAllQuestions).toEqual(false);
    wrapper1.instance().handleExpandChange(true);
    expect(wrapper1.state().showAllQuestions).toEqual(true);
  });

  test("getNextScript Function", () => {
    expect(
      wrapper1.instance().getNextScript({
        interactionStep: currentInteractionStep,
        answerIndex: 0
      })
    ).toBe("bar");
  });
});
