import React from 'react'
import PropTypes from 'prop-types'

class CampaignOSDIQuestionFetcher extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      questionsLoading: false,
      questionsLoaded: false,
      questions: []
    }
  }
  render() {
    return (
      <div>hello world</div>
    )
  }
}

export default CampaignOSDIQuestionFetcher
