import React, { Component } from 'react'
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
    const answer = this.props.contact.surveyAnswer(survey._id)
    if (answer) {
      const child = survey.allowedAnswers.find(({ value }) => value == answer.value)
      if (child.surveyQuestionId) {
        console.log(SurveyQuestions.find({}))
        return this.renderQuestion(SurveyQuestions.findOne(child.surveyQuestionId))
      }
    }

    return ''
  }

  render() {
    const { survey } = this.props
    if (!survey) {
      return null
    }

    return (
      <div style={styles.base}>
        {this.renderQuestion(survey)}
        {this.renderChildren(survey)}
      </div>)
  }
}

SurveyList.propTypes = {
  survey: React.PropTypes.object,
  contact: React.PropTypes.object,
  onSurveyChange: React.PropTypes.function,
  onScriptChange: React.PropTypes.function
}
