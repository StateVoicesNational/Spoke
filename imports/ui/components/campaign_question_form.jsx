import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'

import Formsy from 'formsy-react'
import { FormsyText, FormsySelect } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'

import ContentClear from 'material-ui/svg-icons/content/clear'
import Dialog from 'material-ui/Dialog'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { muiTheme } from '../../ui/theme'
import { grey400 } from 'material-ui/styles/colors'
import { Toolbar, ToolbarGroup, ToolbarTitle, ToolbarSeparator } from 'material-ui/Toolbar'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import ForwardIcon from 'material-ui/svg-icons/navigation/arrow-forward'
import BackIcon from 'material-ui/svg-icons/navigation/arrow-back'
import EditIcon from 'material-ui/svg-icons/image/edit'
import Divider from 'material-ui/Divider'
import Subheader from 'material-ui/Subheader'

const styles = {
  icon: {
    width: 18,
    height: 18,
  },
  button: {
    width: 22,
    height: 18,
  },
  scriptRow: {
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`
  },
  scriptTitle: {
    fontWeight: 'medium'
  },
  scriptSection: {
    marginBottom: 46
  },
  scriptSectionSubtitle: {
    color: 'gray',
    fontWeight: 'light',
    marginTop: 0,
    marginBottom: 36,
    fontSize: 12
  },
  scriptSectionTitle: {
    marginBottom: 0
  },
  question: {
    borderLeft: `5px solid ${muiTheme.palette.primary1Color}`,
    marginBottom: 24,
  },
  followUp: {
    borderLeft: `5px solid ${muiTheme.palette.primary2Color}`,
    marginLeft: 24,
    marginBottom: 24,
  },
  radioButtonIcon: {
    height: '14px',
    verticalAlign: 'middle'
  },
  addAnswerButton: {
    textTransform: 'none',
    paddingLeft: 0,
    fontSize: '12'
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
    width: '180px',
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

const QuestionLink = ({text, isLinkToParent}) => (
  <FlatButton
    label={text}
    secondary
    icon={isLinkToParent ? <BackIcon /> : <ForwardIcon />}
  />
)
export class CampaignQuestionForm extends Component {
  constructor(props) {
    super(props)
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
    this.addAnswer = this.addAnswer.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)
    this.handleDeleteScript = this.handleDeleteScript.bind(this)
    this.handleUpdateAnswer = this.handleUpdateAnswer.bind(this)
    this.handleDeleteQuestion = this.handleDeleteQuestion.bind(this)
    // this.handleAddFollowup = this.handleAddFollowup.bind(this)

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
    const {onAddSurveyAnswer, question} = this.props
    onAddSurveyAnswer(question._id)
  }

  handleQuestionChange(event) {
    const { question, onEditQuestion } = this.props
    onEditQuestion(question._id, { text: event.target.value })
  }

  renderAnswer(otherQuestions, question, answer, autoFocus, index) {
    console.log("otherQuestions", otherQuestions, question, answer)
    // const showFollowUp  = otherQuestions.length > 0
    const showFollowUp = false
    const followUpQuestions = showFollowUp ? (
      <div>
        <Divider />
        <Subheader>
          Follow-up question
        </Subheader>
        <MenuItem
          insetChildren={true}
          checked={!answer.surveyQuestionId}
          value={'none'}
          primaryText="No follow-up"
          onTouchTap={ () => this.handleUpdateAnswer(answer._id, { surveyQuestionId: null})}
        />
        { otherQuestions.map((otherQuestion) => (
          <MenuItem
            insetChildren={true}
            checked={answer.surveyQuestionId === otherQuestion._id}
            value={otherQuestion._id}
            onTouchTap={ (event) => this.handleUpdateAnswer(answer._id, { surveyQuestionId: otherQuestion._id})}
            primaryText={otherQuestion.text}
          />
        ))}
      </div>
    ) : ''
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
            value={ answer.value }
          />
          <div style={styles.script}>
            { answer.script }
          </div>
          <div style={styles.script}>
            { answer.surveyQuestionId ? <QuestionLink text={otherQuestions.find((q) => q._id === answer.surveyQuestionId).text} isLinkToParent={false} /> : '' }
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
            { followUpQuestions }
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
    const { question, onEditQuestion } = this.props
    console.log(answerId, updates)
    //FIXME inefficintes
    const allowedAnswers = question.allowedAnswers.map((allowedAnswer) => {
      if (allowedAnswer._id === answerId) {
        console.log(updates)
        return _.extend(allowedAnswer, updates)
      }
      return allowedAnswer
    })
    onEditQuestion(question._id, { allowedAnswers })

  }

  handleDeleteQuestion() {
    const {onDeleteQuestion, question} = this.props
    onDeleteQuestion(question._id)
  }
  handleDeleteAnswer(answer) {
    const { question, onEditQuestion } = this.props
    const allowedAnswers = _.reject(question.allowedAnswers, (allowedAnswer) => allowedAnswer._id === answer._id)
    console.log("new allowedAnswers", allowedAnswers, 'try to remove', answer._id)
    onEditQuestion(question._id, { allowedAnswers })
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

  renderAnswers(questions, question, questionIsFocused) {
    const otherQuestions = _.reject(questions, (q) => q._id === question._id)

    const answers = question.allowedAnswers
    return (
      <div>
        { _.map(answers, (answer, index) => (
          this.renderAnswer(otherQuestions, question, answer,  !questionIsFocused && index === (answers.length - 1), index)
        ))}
        <RadioButtonUnchecked
          style={styles.radioButtonIcon}
        />
        <FlatButton
          style={styles.addAnswerButton}
          labelStyle={styles.addAnswerButton}
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
    const { question, questions } = this.props
    const questionIsFocused = question.text === ''
    console.log("IS QUSETION FOCUSED", questionIsFocused, question.text)
    // const parentQuestions = questions.filter((q) => _.includes(q.allowedAnswers.map((answer) => answer.surveyQuestionId), question._id))
    const parentQuestions = []

    const isFollowUp = parentQuestions.length > 0
    return (
      <Card style={isFollowUp ? styles.followUp : styles.question}>
        <CardText>
          <div>
            <FormsyText
              name="question"
              autoFocus={questionIsFocused}
              onChange={this.handleQuestionChange.bind(this)}
              required
              fullWidth
              ref="questionInput"
              hintText="e.g. Can the contact attend the event?"
              value={ question.text }
            />
            { this.renderAnswers(questions, question, questionIsFocused) }
            { this.renderDialog()}
          </div>
        </CardText>
        <Divider />
        <CardActions
          style={{textAlign: 'right'}}
        >
          { parentQuestions.length > 0 ? (
            <span>
              { parentQuestions.map((parentQuestion) => <QuestionLink text={parentQuestion.text} isLinkToParent={true}/>)}
            </span>

          ) : ''}

          <IconButton
            iconStyle={styles.icon}
            style={styles.icon}
            onTouchTap={this.handleDeleteQuestion}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    )
  }
}
