import React from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

export const QuestionDropdown = ({ survey, onSurveyChange, answer }) => (
  <div>
    <SelectField
      floatingLabelText={survey.question}
      onChange={onSurveyChange}
      value={answer ? answer.value: null}
    >
      {survey.allowedAnswers.map(allowedAnswer =>
        <MenuItem
          key={allowedAnswer.value}
          value={{ answer: allowedAnswer.value, surveyQuestionId: survey._id }}
          primaryText={allowedAnswer.value}
        />)}
    </SelectField>
  </div>
)

QuestionDropdown.propTypes = {
  onSurveyChange: React.PropTypes.object,
  survey: React.PropTypes.object,
  answer: React.PropTypes.object
}
