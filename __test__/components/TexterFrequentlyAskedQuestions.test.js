import React from "react";

import { shallow } from "enzyme";
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
    const question = wrapper.find("CardTitle");
    const answer = wrapper.find("CardText p");

    // then
    expect(question.prop("title")).toBe("1. q1");
    expect(answer.text()).toBe("a2");
  });
});
