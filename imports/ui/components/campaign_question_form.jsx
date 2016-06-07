import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'

import Formsy from 'formsy-react';
import { FormsyText } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import ContentClear from 'material-ui/svg-icons/content/clear'
import Dialog from 'material-ui/Dialog'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { muiTheme } from '../../ui/theme'

const styles = {
  question: {
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`,
    marginBottom: 24,
    padding: '0 20px'
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
export class CampaignQuestionForm extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)
    this.handleDeleteScript = this.handleDeleteScript.bind(this)
    this.handleUpdateAnswer = this.handleUpdateAnswer.bind(this)

    this.state = {
      open: false,
      editingAnswer: null
    }
  }

  handleOpenDialog() {
    this.setState({ open: true})
  }
  handleCloseDialog() {
    this.setState({ open: false})
  }

  handleOnKeyDown(event) {
    if (event.keyCode === 13) {
      this.addAnswer()
    }
  }

  addAnswer() {
    const {onAddSurveyAnswer, survey} = this.props
    onAddSurveyAnswer(survey._id)
  }

  handleQuestionChange(event) {
    const { survey, onEditSurvey } = this.props
    onEditSurvey(survey._id, { question: event.target.value })
  }

  renderAnswer(survey, answer, autoFocus, index) {
    return [
      <RadioButtonUnchecked
        style={styles.radioButtonIcon}
      />,
      <FormsyText
        onKeyDown={ this.handleOnKeyDown.bind(this) }
        onChange={ (event) => this.handleUpdateAnswer(answer._id, { value: event.target.value })}
        inputStyle={styles.answer}
        hintStyle={styles.answer}
        required
        name={`allowedAnswers[${index}].value`}
        autoFocus={autoFocus}
        value={ answer.value }
      />,
      <span>
        { answer.script }
      </span>,
      <IconButton
        onTouchTap={() => this.handleDeleteAnswer(answer)}
      >
        <ContentClear />
      </IconButton>,
      <FlatButton
        label="Edit script"
        onTouchTap={() => this.handleEditScript(answer)}
      />,
    ]
  }

  handleEditScript(answer) {
    this.setState({ editingAnswer: answer })
    this.handleOpenDialog()
  }

  handleUpdateAnswer(answerId, updates) {
    const { survey, onEditSurvey } = this.props

    //FIXME inefficintes
    const allowedAnswers = survey.allowedAnswers.map((allowedAnswer) => {
      if (allowedAnswer._id === answerId) {
        console.log(updates)
        return _.extend(allowedAnswer, updates)
      }
      return allowedAnswer
    })
    onEditSurvey(survey._id, { allowedAnswers })

  }

  handleDeleteAnswer(answer) {
    const { survey, onEditSurvey } = this.props
    const allowedAnswers = _.reject(survey.allowedAnswers, (allowedAnswer) => allowedAnswer._id === answer._id)
    console.log("new allowedAnswers", allowedAnswers, 'try to remove', answer._id)
    onEditSurvey(survey._id, { allowedAnswers })
  }

  handleDeleteScript(answer) {
    this.handleUpdateAnswer(answer._id, {script: null})
  }

  handleSaveScript() {
    const { editingAnswer } = this.state
    const script =  this.refs.scriptInput.getValue()
    this.handleUpdateAnswer(editingAnswer._id, {script})
    this.handleCloseDialog()
  }

  renderAnswers(survey, questionIsFocused) {
    const answers = survey.allowedAnswers
    return (
      <div>
        { _.map(answers, (answer, index) => (
          <div className="row">
            <div className="col-xs">
              {this.renderAnswer(survey, answer,  !questionIsFocused && index === (answers.length - 1), index)}
            </div>
          </div>
        ))}
        <FlatButton
          label="Add answer"
          onTouchTap={this.addAnswer}
        />
      </div>
    )
  }

  renderDialog() {
    const { editingAnswer, open } = this.state
    const { customFields, sampleContact } = this.props
    const scriptFields = CampaignContacts.requiredUploadFields.concat(CampaignContacts.userScriptFields).concat(customFields)

    return (
      <Dialog
        actions={[
          <FlatButton
            label="Cancel"
            onTouchTap={this.handleCloseDialog}
          />,
          <RaisedButton
            label="Done"
            onTouchTap={this.handleSaveScript}
            primary
          />
        ]}
        modal
        open={open}
        onRequestClose={this.handleCloseDialog}
      >
        <ScriptEditor
          expandable
          ref="scriptInput"
          script={editingAnswer && editingAnswer.script ? {text: editingAnswer.script} : null}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
        />
      </Dialog>
    )
  }


  render() {
    const { survey } = this.props

    const questionIsFocused = survey.question === ''

    return (
      <div style={styles.question}>
        <Formsy.Form ref="form">
          <div className="row">
            <FormsyText
              autoFocus={questionIsFocused}
              onChange={this.handleQuestionChange.bind(this)}
              required
              floatingLabelText="Question"
              fullWidth
              ref="questionInput"
              name="question"
              hintText="e.g. Can the contact attend the event?"
              value={ survey.question }
            />
            { this.renderAnswers(survey, questionIsFocused) }
          </div>
        </Formsy.Form>
        { this.renderDialog()}
      </div>
    )
  }
}
