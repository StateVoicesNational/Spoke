import React from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

export const SurveyQuestion = ({ survey, onSurveyChange }) => (
  <div>
    <SelectField
      floatingLabelText={survey.question}
      onChange={onSurveyChange}
    >
      {survey.allowedAnswers.map(answer =>
        <MenuItem
          key={answer.value}
          value={{answer, surveyQuestionId:survey._id}}
          primaryText={answer.value}
        />)}
    </SelectField>
  </div>
)

SurveyQuestion.propTypes = {
  onSurveyChange: React.PropTypes.object,
  survey: React.PropTypes.object
}
