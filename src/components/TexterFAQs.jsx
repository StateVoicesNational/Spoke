import React from 'react'
import { Card, CardTitle, CardText } from 'material-ui/Card'

const FAQs = () => {
  const faqs = [
    {
      question: 'What is Spoke?',
      answer: 'An answer!'
    },
    {
      question: 'Another question!',
      answer: 'Another answer!'
    }
  ]

  return (
    <div>
      <h1>Frequently Asked Questions</h1>
      {faqs.map((faq, idx) => (
        <Card>
          <CardTitle
            title={`${idx}. ${faq.question}`}
          />
          <CardText>
            <p>{faq.answer}</p>
          </CardText>
        </Card>
      ))}
    </div>
  )
}

export default FAQs
