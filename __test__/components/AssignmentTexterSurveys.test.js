import React from "react";
import { shallow } from "enzyme";
import AssignmentTexterSurveys from "../../src/components/AssignmentTexterSurveys";

describe("AssignmentTexterSurveys component", () => {
  const questionResponses = {};
  const interactionSteps = [
    {
      id: 1,
      question: {
        id: 1,
        text: "What is foo?",
        answerOptions: ["a", "b", "c", "d"]
      }
    }
  ];
  const currentInteractionStep = {
    id: 1,
    question: {
      id: 1,
      text: "What is foo?",
      answerOptions: ["a", "b", "c", "d"]
    }
  };

  const wrapper = shallow(
    <AssignmentTexterSurveys
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
});
