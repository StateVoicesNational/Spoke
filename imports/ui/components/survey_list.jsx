import React, { Component } from 'react'
import Divider from 'material-ui/Divider'
import { QuestionDropdown } from './survey'
import { SurveyQuestions } from '../../api/survey_questions/survey_questions'
import { updateAnswer } from '../../api/survey_answers/methods'

const styles = {
  base: {
    padding: '0px 24px',
    backgroundColor: '#E8F9FF'
  }
}

export class SurveyList extends Component {
  constructor(props) {
    super(props)
    this.handleSurveyChange = this.handleSurveyChange.bind(this)
  }

  handleSurveyChange(surveyQuestionId, answer, script) {
    const { contact, onScriptChange } = this.props
    updateAnswer.call({
      surveyQuestionId,
      value: answer,
      campaignContactId: contact._id
    })
    onScriptChange(script)
  }

  renderQuestion(survey) {
    const { contact } = this.props

    return <QuestionDropdown
      survey={survey}
      answer={contact.surveyAnswer(survey._id)}
      onSurveyChange={this.handleSurveyChange}
    />
  }

  renderChildren(survey) {
    const { contact } = this.props

    const messages = contact.messages().fetch()
    console.log("messages in renderChildren", messages)
    const responseNeeded = (messages.length > 0 && messages[messages.length - 1].isFromContact)

    const answer = contact.surveyAnswer(survey._id)
    if (answer) {
      const child = survey.allowedAnswers.find(({ value }) => value === answer.value)
      if (child.surveyQuestionId) {
        const childQuestion = SurveyQuestions.findOne(child.surveyQuestionId)
        if (contact.surveyAnswer(childQuestion._id) || responseNeeded) {
          return this.renderQuestion(childQuestion)
        }
      }
    }

    return ''
  }

  render() {
    const { survey, contact } = this.props
    if (!survey || contact.messages().fetch().length === 0) {
      return null
    }

    return (
      <div style={styles.base}>
        {this.renderQuestion(survey)}
        {this.renderChildren(survey)}
        <Divider />
      </div>)
  }
}

SurveyList.propTypes = {
  contact: React.PropTypes.object,
  survey: React.PropTypes.object,
  onScriptChange: React.PropTypes.function,
}
