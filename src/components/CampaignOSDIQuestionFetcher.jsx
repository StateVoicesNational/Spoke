import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import loadData from '../containers/hoc/load-data'


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
    const { osdiQuestions } = this.props.osdiQuestions.organization
    return (
          <div>
            <div>hello world, I'm the OSDI question fetcher, and I have {osdiQuestions.length} questions to share with you today.</div>
            <ul>
              {osdiQuestions.forEach((q, i) => <li key={i}>q</li>)}
            </ul>
          </div>
    )
  }
}

CampaignOSDIQuestionFetcher.propTypes = {
  organizationId: PropTypes.string.isRequired
}

const mapQueriesToProps = ({ ownProps }) => ({
  osdiQuestions: {
    query: gql`query getLists($organizationId: String!) {
      organization(id: $organizationId) {
        osdiQuestions
        id
      }
    }`,
    variables: {
      organizationId: ownProps.organizationId
    }
  }
})

export default loadData(CampaignOSDIQuestionFetcher, {mapQueriesToProps})
