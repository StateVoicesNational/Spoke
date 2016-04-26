import React from 'react'
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
const styles = {
  survey: {
    backgroundColor: "green"
  }
}
export const Survey = ({question, answers, onSurveyChange}) => (
  <div style={styles.survey}>
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