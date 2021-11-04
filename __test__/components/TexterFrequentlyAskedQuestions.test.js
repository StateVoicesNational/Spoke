import React from "react";
import { shallow } from "enzyme";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import TexterFaqs from "../../src/components/TexterFrequentlyAskedQuestions";

describe("FAQs component", () => {
  // given
  const faq = [
    {
      question: "q1",
      answer: "a2"
    }
  ];
  const wrapper = shallow(<TexterFaqs faqs={faq} />);

  // when
  test("Renders question and answer", () => {
    const question = wrapper.find(CardHeader);
    const answer = wrapper.find(CardContent).find("p");

    // then
    expect(question.at(0).prop("title")).toBe("1. q1");
    expect(answer.at(0).text()).toBe("a2");
  });
});
