import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { ScriptEditor } from './script_editor'
import Divider from 'material-ui/Divider'
import TextField from 'material-ui/TextField'
import Formsy from 'formsy-react';
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup,
    FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'

const styles = {
  radioButtonIcon: {
    height: '14px',
    verticalAlign: 'middle'
  },
  answer: {
    fontSize: '13px'
  }
}
export class CampaignSurveyForm extends Component {
  handleOnKeyDown(event) {
    if (event.keyCode === 13) {
      const {onAddSurveyAnswer, survey} = this.props
      console.log("keydown")
      onAddSurveyAnswer(survey._id)
    }
  }

  handleSurveyChange() {
    const { survey, onEditSurvey } = this.props
    onEditSurvey(survey._id, this.refs.form.getModel())
  }

  render() {
    const { survey } = this.props

    const questionIsFocused = survey.question === ''
    console.log("questionIsFocused", questionIsFocused)
    return (
      <div>
        <Formsy.Form ref="form">
          <FormsyText
            autoFocus={questionIsFocused}
            onChange={this.handleSurveyChange.bind(this)}
            required
            fullWidth
            name="question"
            hintText="Question"
            value={ survey.question }
          />
          { _.map(survey.allowedAnswers, (answer, index) => (
            <div>
              <RadioButtonUnchecked
                style={styles.radioButtonIcon}
              />
              <FormsyText
                onKeyDown={ this.handleOnKeyDown.bind(this) }
                onChange={ this.handleSurveyChange.bind(this)}
                inputStyle={styles.answer}
                required
                name={`allowedAnswers[${index}].value`}
                autoFocus={ !questionIsFocused && index === (survey.allowedAnswers.length - 1) }
                value={ answer.value }

              />
            </div>
          ))}

        </Formsy.Form>
      </div>
    )
  }
}
