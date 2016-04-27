import React from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem';

export const SurveyQuestion = ({ survey, onSurveyChange }) => (
  <div>
    <SelectField
      floatingLabelText={survey.question}
      onChange={onSurveyChange}
    >
      {survey.children().fetch().map(answer =>
        <MenuItem
          key={answer._id}
          value={answer._id}
          primaryText={answer.answer}
        />)}
    </SelectField>
    {survey._id} -
    { survey.question } -
    { survey.parentCampaignSurveyId }
    { survey.answer }
  </div>
)

SurveyQuestion.propTypes = {
  onSurveyChange: React.PropTypes.object,
  survey: React.PropTypes.object,
}


