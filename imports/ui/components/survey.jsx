import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleSurveyChange = this.handleSurveyChange.bind(this)
  }

  handleSurveyChange(event, index, value) {
    const { onSurveyChange, survey } = this.props
    const script = survey.allowedAnswers.find( (allowedAnswer) => allowedAnswer.value == value).script
    onSurveyChange(survey._id, value, script)
  }

  render () {
    const { survey, answer } = this.props
    return <div>
      <SelectField
        floatingLabelText={survey.question}
        onChange={this.handleSurveyChange}
        value={answer ? answer.value : ''}
        fullWidth
      >
        {survey.allowedAnswers.map(allowedAnswer =>
          <MenuItem
            key={allowedAnswer.value}
            value={allowedAnswer.value}
            primaryText={allowedAnswer.value}
          />)}
      </SelectField>
    </div>
  }
}


QuestionDropdown.propTypes = {
  onSurveyChange: React.PropTypes.function,
  survey: React.PropTypes.object,
  answer: React.PropTypes.object
}
