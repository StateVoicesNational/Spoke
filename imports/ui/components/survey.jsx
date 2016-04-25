import React from 'react'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';

export const Survey = ({question, answers, onSurveyChange}) => (
  <div>
    <p>{question}</p>
    <RadioButtonGroup name="survey"
      onChange={onSurveyChange} >
      {answers.map(answer => <RadioButton
          key={answer._id}
          value={answer._id}
          label={answer.answer}
        /> )}
    </RadioButtonGroup>
  </div>
)