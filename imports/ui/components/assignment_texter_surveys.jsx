import React, { Component } from 'react'
import { QuestionDropdown } from './question_dropdown'
import { updateAnswer } from '../../api/survey_answers/methods'
import Divider from 'material-ui/Divider'

const styles = {
  root: {
    padding: '0px 20px',
  }
}
export class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stepIndex: 0
    }
  }

  handleNext() {
    const {stepIndex} = this.state
    this.setState({
      stepIndex: stepIndex + 1,
    })
  }

  handlePrevious() {
    const {stepIndex} = this.state
    this.setState({
      stepIndex: stepIndex - 1,
    })
  }

  handleSurveyAnswerChange(surveyQuestionId, answer, script) {
    const { contact, onScriptChange } = this.props

    updateAnswer.call({
      surveyQuestionId,
      value: answer,
      campaignContactId: contact._id,
      campaignId: contact.campaignId
    })
    // This should actually happen from propagating props
    onScriptChange(script)
  }

  renderCurrentQuestion() {
    const { contact, steps } = this.props
    console.log("steps", steps)
    const { stepIndex } = this.state

    const step = steps[stepIndex]
    console.log(step)
    return (
      <QuestionDropdown
        answer={contact.surveyAnswer(step._id)}
        onAnswerChange={this.handleSurveyAnswerChange.bind(this)}
        step={step}
      />
    )
  }
  render() {
    const { contact, steps } = this.props
    return steps.length === 0 ? <div /> : (
      <div style={styles.root}>
        {this.renderCurrentQuestion()}
      </div>

    )
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: React.PropTypes.object,      // current assignment
  questions: React.PropTypes.array,   // contacts for current assignment
}


