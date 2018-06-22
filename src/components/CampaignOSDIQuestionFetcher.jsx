import React from 'react'
import PropTypes from 'prop-types'
// import gql from 'graphql-tag'
import { ApolloConsumer } from 'react-apollo'

// const OSDI_QUESTIONS_QUERY = gql`query getLists($organizationId: String!) {
//   organization(id: $organizationId) {
//     osdiQuestions
//   }
// }`

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
    const { organizationId } = this.props
    return (
      <ApolloConsumer>
        {client => (
          <div>
            <div>hello world, I'm the OSDI question fetcher</div>
            {/* <button
              onClick={async () => {
                const { data } = await client.query({
              query: OSDI_QUESTIONS_QUERY,
              variables: { organizationId }
                })
                this.setState({ questions: data })
              }}
              >
              Load questions
            </button> */}
          </div>
        )}
      </ApolloConsumer>
    )
  }
}

CampaignOSDIQuestionFetcher.propTypes = {
  organizationId: PropTypes.string.isRequired
}

export default CampaignOSDIQuestionFetcher
