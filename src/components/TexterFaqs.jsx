import React from 'react'
import PropTypes from 'prop-types'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'

const TexterFaqs = ({ faqs }) => {
  return (
    <div>
      <h1>Frequently Asked Questions</h1>
      {faqs.map((faq, idx) => (
        <Card key={idx}>
          <CardHeader
            title={`${idx + 1}. ${faq.question}`}
          />
          <CardContent>
            <p>{faq.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

TexterFaqs.propTypes = {
  faqs: PropTypes.array
}

export default TexterFaqs
