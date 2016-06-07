import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'

import Formsy from 'formsy-react'
import { FormsyText } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'

import ContentClear from 'material-ui/svg-icons/content/clear'
import Dialog from 'material-ui/Dialog'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { muiTheme } from '../../ui/theme'
import { grey400 } from 'material-ui/styles/colors'
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
  answerRow: {
    marginTop: 16,
    marginBottom: 16
  },
  script: {
    verticalAlign: 'middle',
    display: 'inline-block',
    width: '250px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    marginLeft: '24',
    fontSize: 11,
    color: grey400
  },
  scriptHint: {
    fontSize: '12',
  },
  scriptInput: {
    fontSize: '12',
  },

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
    return (
        <div style={styles.answerRow}>
          <RadioButtonUnchecked
            style={styles.radioButtonIcon}
          />
          <FormsyText
            onKeyDown={ this.handleOnKeyDown.bind(this) }
            onChange={ (event) => this.handleUpdateAnswer(answer._id, { value: event.target.value })}
            inputStyle={styles.answer}
            hintStyle={styles.answer}
            required
            name={`allowedAnswers[${index}].value`}
            autoFocus={autoFocus}
            value={ answer.value }
          />
          <div style={styles.script}>
            { answer.script }
          </div>
          <IconMenu
            style={{float: 'right', width: 24, height: 20}}
            iconButtonElement={
              <IconButton
                style={{float: 'right', width: 24, height: 20}}
                iconStyle={{width: 20, height: 20}}
              ><MoreVertIcon /></IconButton>}
            anchorOrigin={{horizontal: 'left', vertical: 'top'}}
            targetOrigin={{horizontal: 'left', vertical: 'top'}}
          >
            <MenuItem
              primaryText="Edit script"
              onTouchTap={() => this.handleEditScript(answer)}
            />
            <MenuItem
              primaryText="Delete script"
              onTouchTap={() => this.handleDeleteScript(answer)}
            />
          </IconMenu>

          <IconButton
            style={{float: 'right', width: 24, height: 20}}
            iconStyle={{width: 20, height: 20}}
            onTouchTap={() => this.handleDeleteAnswer(answer)}
          >
            <ContentClear />
          </IconButton>
      </div>
    )

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
          this.renderAnswer(survey, answer,  !questionIsFocused && index === (answers.length - 1), index)
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
            <FormsyText
              autoFocus={questionIsFocused}
              onChange={this.handleQuestionChange.bind(this)}
              required
              fullWidth
              ref="questionInput"
              name="question"
              hintText="e.g. Can the contact attend the event?"
              value={ survey.question }
            />
            { this.renderAnswers(survey, questionIsFocused) }
        </Formsy.Form>
        { this.renderDialog()}
      </div>
    )
  }
}
