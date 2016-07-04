import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import Dialog from 'material-ui/Dialog'
import { allScriptFields } from '../../api/scripts/scripts'
import { muiTheme } from '../../ui/theme'
import { grey100 } from 'material-ui/styles/colors'
import {Card, CardActions, CardHeader,  CardText} from 'material-ui/Card';
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import Divider from 'material-ui/Divider'
import {CampaignQuestionFormAnswerRow} from './campaign_question_form_answer_row'
import { getAllParents } from '../local_collections/interaction_steps'

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
  interactionStep: {
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
  scriptInput: {
    fontSize: '12',
  },
  cardHeader: {
    backgroundColor: grey100
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
    this.handleDeleteQuestion = this.handleDeleteQuestion.bind(this)
    this.handleQuestionChange = this.handleQuestionChange.bind(this)
    this.handleScriptChange = this.handleScriptChange.bind(this)
    // TODO can probably simplify these  into one or two methods that send the whole formsy form

    this.state = {
      open: false,
      script: null
    }
  }

  handleOpenDialog() {
    this.setState({ open: true}, () => this.refs.scriptInput.focus())
  }
  handleCloseDialog() {
    this.setState({ open: false})
  }

  addAnswer() {
    const {onAddSurveyAnswer, interactionStep} = this.props
    onAddSurveyAnswer(interactionStep._id)
  }

  handleQuestionChange(event) {
    const { interactionStep, onEditQuestion } = this.props
    onEditQuestion(interactionStep._id, { question: event.target.value })
  }

  handleScriptChange(event) {
    const { interactionStep, onEditQuestion } = this.props
    onEditQuestion(interactionStep._id, { script: event.target.value })
  }

  handleDeleteQuestion() {
    const {onDeleteQuestion, interactionStep} = this.props
    onDeleteQuestion(interactionStep._id)
  }

  handleDeleteAnswer(answer) {
    const { interactionStep, onEditQuestion } = this.props
    const allowedAnswers = _.reject(interactionStep.allowedAnswers, (allowedAnswer) => allowedAnswer._id === answer._id)
    onEditQuestion(interactionStep._id, { allowedAnswers })
  }

  handleDeleteScript(answer) {
    this.handleUpdateAnswer(answer._id, {script: null})
  }

  handleSaveScript() {
    const script =  this.refs.scriptInput.getValue()
    this.refs.formsyScript.setState({ value: script })
    this.setState( { script })
    this.handleCloseDialog()
  }

  renderAnswers(interactionSteps, interactionStep, interactionStepIsFocused) {
    const { onAddQuestion, onEditQuestion } = this.props

    const otherQuestions = _.reject(interactionSteps, (q) => q._id === interactionStep._id)


    const answers = interactionStep.allowedAnswers
    return (
      <div>
        { _.map(answers, (answer, index) => (
          <CampaignQuestionFormAnswerRow
            onAddAnswer={this.addAnswer}
            onDeleteAnswer={this.handleDeleteAnswer}
            onEditQuestion={onEditQuestion}
            otherQuestions={otherQuestions}
            interactionStep={interactionStep}
            answer={answer}
            autoFocus={!interactionStepIsFocused && index === (answers.length - 1)}
            index={index}
            onAddQuestion={onAddQuestion}
          />
        ))}
        <RadioButtonUnchecked
          style={styles.radioButtonIcon}
        />
        <FlatButton
          style={styles.addAnswerButton}
          labelStyle={styles.addAnswerButton}
          label="Add another answer"
          onTouchTap={this.addAnswer}
        />
      </div>
    )
  }

  renderDialog() {
    const { script, open } = this.state
    const { customFields, sampleContact } = this.props
    const scriptFields = allScriptFields(customFields)

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
          scriptText={script}
          sampleContact={sampleContact}
          scriptFields={scriptFields}
        />
      </Dialog>
    )
  }

  render() {
    const { interactionStep, interactionSteps, campaignStarted } = this.props
    const { script } = this.state
    const interactionStepIsFocused = interactionStep.question === ''
    // const parentQuestions = interactionSteps.filter((q) => _.includes(q.allowedAnswers.map((answer) => answer.surveyQuestionId), interactionStep._id))
    const parentQuestions = []
    const cardActions = campaignStarted ? '' : (
      <Divider />,
      <CardActions
        style={{textAlign: 'right'}}
      >

        <IconButton
          iconStyle={styles.icon}
          style={styles.icon}
          onTouchTap={this.handleDeleteQuestion}
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    )

    const stepTitle = (step) => {
      if (step.isTopLevel) {
        return "Start"
      } else {
        const parents = getAllParents(step)
        return parents.map((step) => step).join(' > ')
      }
    }

    console.log("script text", script)

    const isFollowUp = parentQuestions.length > 0
    return (
      <Card style={isFollowUp ? styles.followUp : styles.interactionStep}>
        <CardHeader
          style={styles.cardHeader}
          title={stepTitle(interactionStep)}
          subtitle=""
        />
        <Divider/>

        <CardText>
          <div>
            <FormsyText
              onTouchTap={this.handleOpenDialog}
              name="script"
              autoFocus
              floatingLabelText="Script"
              ref="formsyScript"
              onChange={this.handleQuestionChange}
              fullWidth
              value={script}
              // floatingLabelText="Script"
            />

            <FormsyText
              name="interactionStep"
              floatingLabelText="Question"
              autoFocus={interactionStepIsFocused}
              onChange={this.handleScriptChange}
              onFocus={(event) => event.target.select()}
              required
              fullWidth
              disabled={campaignStarted}
              ref="interactionStepInput"
              hintText="E.g. Can the contact attend the event?"
              value={ interactionStep.text }
            />
            { this.renderAnswers(interactionSteps, interactionStep, interactionStepIsFocused) }
            { this.renderDialog()}
          </div>
        </CardText>
        <Divider/>
        {cardActions}
      </Card>
    )
  }
}
