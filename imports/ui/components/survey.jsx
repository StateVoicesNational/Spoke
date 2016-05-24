import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'

const styles = {
  form: {
    padding: '0 20px',
    backgroundColor: '#F8F8F8',
    width: '100%'
  }
}

export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleSurveyChange = this.handleSurveyChange.bind(this)
  }

  handleSurveyChange(event, value, index) {
    const { onSurveyChange, survey } = this.props
    console.log(event.target.value)
    console.log("event", event, value, index)
    console.log(survey.allowedAnswers.map((a) => a.value))
    console.log("survey.allowedAnswers", survey.allowedAnswers)
    const script = survey.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).script

    console.log(survey.allowedAnswers)
    onSurveyChange(survey._id, value, script)
  }

  render () {
    const { survey, answer } = this.props
    return (
      <Formsy.Form style={styles.form}>
        <FormsySelect
          floatingLabelText={survey.question}
          onChange={this.handleSurveyChange}
          name={survey.question}
          value={answer ? answer.value : ''}
        >
          {survey.allowedAnswers.map(allowedAnswer =>
            <MenuItem
              key={allowedAnswer.value}
              value={allowedAnswer.value}
              primaryText={allowedAnswer.value}
            />)}
        </FormsySelect>
      </Formsy.Form>
    )
  }
}


QuestionDropdown.propTypes = {
  onSurveyChange: React.PropTypes.function,
  survey: React.PropTypes.object,
  answer: React.PropTypes.object
}
