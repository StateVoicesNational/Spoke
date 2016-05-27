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
  root: {
    marginBottom: 24
  },
  radioButtonIcon: {
    height: '14px',
    verticalAlign: 'middle'
  },
  answer: {
    fontSize: '12'
  },
  script: {
    marginLeft: '24'
  },
  scriptHint: {
    fontSize: '12',
  },
  scriptInput: {
    fontSize: '12',
  },
  button: {
    fontSize: '11px',
    opacity: 0.5
  }

}
export class CampaignSurveyForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showScript: false
    }
  }
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

    // const { showScript } = this.state
    const showScript = true // FIXME
    return (
      <div style={styles.root}>
        <Formsy.Form ref="form">
          <div className="row">
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
              <div className="row">
                <div className="col-xs">
                  <RadioButtonUnchecked
                    style={styles.radioButtonIcon}
                  />
                  <FormsyText
                    onKeyDown={ this.handleOnKeyDown.bind(this) }
                    onChange={ this.handleSurveyChange.bind(this)}
                    inputStyle={styles.answer}
                    hintStyle={styles.answer}
                    required
                    name={`allowedAnswers[${index}].value`}
                    autoFocus={ !questionIsFocused && index === (survey.allowedAnswers.length - 1) }
                    value={ answer.value }
                  />
                  { showScript ? '' : (
                    <FlatButton
                      labelStyle={styles.button}
                      label="Add script"
                      onTouchTap={() => this.setState({showScript: true})}
                    />
                  )}
                </div>
                {
                  showScript ? (
                    <div className="col-xs">
                      <FormsyText
                        style={styles.script}
                        inputStyle={styles.scriptInput}
                        hintStyle={styles.scriptHint}
                        onKeyDown={ this.handleOnKeyDown.bind(this) }
                        hintText="Script for this answer"
                        name={`allowedAnswers[${index}].script`}
                        value={ answer.script }
                        onChange={ this.handleSurveyChange.bind(this) }
                      />
                    </div>
                  ) : ''
                }

              </div>
            ))}
          </div>
        </Formsy.Form>
      </div>
    )
  }
}
