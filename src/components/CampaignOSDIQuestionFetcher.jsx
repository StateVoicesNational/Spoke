import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import loadData from '../containers/hoc/load-data'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton/RaisedButton'

class CampaignOSDIQuestionFetcher extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedQuestionIndex: -1,
      selectedQuestion: { description: '', responses: '' }
    }
  }

  selectQuestion = (e, i, v) => {
    const selectedQuestion = JSON.parse(this.props.osdiQuestions.organization.osdiQuestions[v])
    console.log('selected question', v, 'details', selectedQuestion)
    this.setState({
      selectedQuestionIndex: v,
      selectedQuestion
    })
  }

  render() {
    const { osdiQuestions } = this.props.osdiQuestions.organization
    const questionsAvailable = osdiQuestions.length > 0
    const { description, responses } = this.state.selectedQuestion
    return (
      <div>
        <div>hello world, I'm the OSDI question fetcher, and I have {osdiQuestions.length} questions to share with you today.</div>
        {questionsAvailable ?
          <div>
            <SelectField
              value={this.state.selectedQuestionIndex}
              onChange={this.selectQuestion}
            >
              <MenuItem disabled key={-1} value={-1} primaryText='Select a question...' />
              {osdiQuestions.map((s, i) => {
                const { name, title } = JSON.parse(s)
                return <MenuItem value={i} key={name} primaryText={title} />
              })}
            </SelectField>
            {this.state.selectedQuestionIndex >= 0 &&
              <div>
                <p>
                  <em>Question: </em>{description}
                </p>
                <p>
                  <em>Responses:</em>
                  <ul>
                    {responses.map(r => <li>{r.title}</li>)}
                  </ul>
                </p>
                <RaisedButton primary label='Map' />
              </div>
            }
          </div>
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
