import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import loadData from '../containers/hoc/load-data'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

const DEFAULT_QUESTION_SELECT_ITEM_VAL = 'default'
class CampaignOSDIQuestionFetcher extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedQuestion: DEFAULT_QUESTION_SELECT_ITEM_VAL
    }
  }

  selectQuestion = (e, i, v) => {
    console.log('selected', i, v)
    // console.log(e)
    this.setState({ selectedQuestion: v })
  }

  render() {
    const { osdiQuestions } = this.props.osdiQuestions.organization
    const questionsAvailable = osdiQuestions.length > 0
    return (
      <div>
        <div>hello world, I'm the OSDI question fetcher, and I have {osdiQuestions.length} questions to share with you today.</div>
        {questionsAvailable ?
          <SelectField
            value={this.state.selectedQuestion}
            onChange={this.selectQuestion}
          >
            <MenuItem value={DEFAULT_QUESTION_SELECT_ITEM_VAL}>Select a question...</MenuItem>
            {osdiQuestions.map((q, i) => <MenuItem value={i} key={q} primaryText={q} />)}
          </SelectField>
        : <div>No questions were found. Please check your OSDI credentials and make sure questions exist in the target system.</div>
        }

      </div>
    )
  }
}

CampaignOSDIQuestionFetcher.propTypes = {
  organizationId: PropTypes.string.isRequired,
  osdiQuestions: PropTypes.object.isRequired
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

export default loadData(CampaignOSDIQuestionFetcher, { mapQueriesToProps })
