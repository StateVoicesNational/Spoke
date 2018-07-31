import React from 'react'

import { shallow } from 'enzyme';
import TexterFaqs from '../../src/components/TexterFaqs'

describe('FAQs component', () => {
  // given
  const faq = [
    {
      question: 'q1',
      answer: 'a2'
    }
  ]
  const wrapper = shallow(
    <TexterFaqs faqs={faq} />
  )

  // when
  test('Renders question and answer', () => {
    const question = wrapper.find('WithStyles(CardHeader)')
    const answer = wrapper.find('WithStyles(CardContent) p')

    // then
    expect(question.prop('title')).toBe('1. q1')
    expect(answer.text()).toBe('a2')
  })
})
