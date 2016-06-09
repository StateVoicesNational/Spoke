import React, { Component } from 'react'
import { QuestionDropdown } from './question_dropdown'
import { updateAnswer } from '../../api/survey_answers/methods'

export class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)
    this.state = {
      questionIndex: 0
    }
  }

  handleNext() {
    const {questionIndex} = this.state
    this.setState({
      questionIndex: questionIndex + 1,
    })
  }

  handlePrevious() {
    const {questionIndex} = this.state
    this.setState({
      questionIndex: questionIndex - 1,
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
    const { contact, questions } = this.props
    const { questionIndex } = this.state
    const question = questions[questionIndex]
    console.log(question)
    return (
      <QuestionDropdown
        answer={contact.surveyAnswer(question._id)}
        onAnswerChange={this.handleSurveyAnswerChange.bind(this)}
        question={question}
      />
    )
  }
  render() {
    const { contact, questions } = this.props
    console.log(questions, "QUSETIONS!!!!")
    return questions.length === 0 ? <div /> : this.renderCurrentQuestion()
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: React.PropTypes.object,      // current assignment
  questions: React.PropTypes.array,   // contacts for current assignment
}


