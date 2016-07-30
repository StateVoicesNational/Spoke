import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'

const styles = {
  previousStep: {
    fontSize: 16,
    verticalAlign: 'middle'
  },
  currentStep: {
    // fontSize: 16,
  },
  currentStepSelect: {
    fontSize: 16,
    color: 'red'
  },
  previousStepSelect: {
    fontSize: 16,
    opacity: 0.8
    // fontSize: 16
  },
  previousStepLabel: {
    fontSize: 16
  },
  currentStepLabel: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold'
  }
}

class AssignmentTexterSurveyDropdown extends Component {
  handleAnswerChange = async (event, index, value) => {
    const { onAnswerChange, step, campaignContactId } = this.props
    const { question } = step

    if (value === 'clearResponse') {
      // onAnswerChange(step.id, null, null)
    } else {
      const questionResponse = {
        interactionStepId: step.id,
        campaignContactId,
        value
      }
      await this.props.mutations.editQuestionResponse(questionResponse)
      // onAnswerChange(step.id, value, nextInteractionStep ? nextInteractionStep.script : null)
    }
  }

  renderAnswers() {
    const { step } = this.props
    const menuItems = step.question.answerOptions.map(answerOption =>
      <MenuItem
        key={answerOption.value}
        value={answerOption.value}
        primaryText={answerOption.value}
      />
    )

    menuItems.push(<Divider />)
    menuItems.push(
      <MenuItem
        key='clear'
        value='clearResponse'
        primaryText='Clear response'
        // onTouchTap={(event) => this.handleAnswerDelete(event, step.id)}
      />
    )

    return menuItems
  }

  render() {
    const { step, isCurrentStep } = this.props
    const responseValue = step.questionResponse ? step.questionResponse.value : null
    const { question } = step

    if (!question) {
      return null
    } else {
      return (
        <div>
            <SelectField
              style={isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect}
              onChange={this.handleAnswerChange}
              name={question.id}
              value={responseValue}
              floatingLabelText={question.text}
              hintText='Choose answer'
            >
              {this.renderAnswers()}
            </SelectField>
        </div>
      )
    }
  }
}

AssignmentTexterSurveyDropdown.propTypes = {
  step: React.PropTypes.object,
  answerValue: React.PropTypes.object,
  isCurrentStep: React.PropTypes.boolean
}

const mapMutationsToProps = () => ({
  editQuestionResponse: (questionResponse) => ({
    mutation: gql`
      mutation editQuestionResponse($questionResponse: QuestionResponseInput!) {
        editQuestionResponse(questionResponse: $questionResponse) {
          id
          value
        }
      }
    `,
    variables: {
      questionResponse
    }
  })
})

export default loadData(AssignmentTexterSurveyDropdown, { mapMutationsToProps })
