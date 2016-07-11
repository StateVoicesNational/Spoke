import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import RaisedButton from 'material-ui/RaisedButton'
import { ScriptEditor } from './script_editor'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import { allScriptFields } from '../../api/scripts/scripts'
import { muiTheme } from '../../ui/theme'
import { grey100 } from 'material-ui/styles/colors'
import {Card, CardActions, CardHeader,  CardText} from 'material-ui/Card';
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import Divider from 'material-ui/Divider'
import {CampaignQuestionFormAnswerRow} from './campaign_question_form_answer_row'
import { getAllParents } from '../local_collections/interaction_steps'
import { ScriptField } from './script_field'
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
  },
  cardText: {
    marginBottom:48
  },
  questionSpan: {
    fontWeight: 'normal',
    opacity: 0.8
  },
  answerSpan: {
    fontWeight: 'normal',
    opacity: 0.8
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black'
  }

}


export class CampaignQuestionForm extends Component {
  constructor(props) {
    super(props)
    this.addAnswer = this.addAnswer.bind(this)
    this.handleSaveScript = this.handleSaveScript.bind(this)
    this.handleDeleteScript = this.handleDeleteScript.bind(this)
    this.handleDeleteQuestion = this.handleDeleteQuestion.bind(this)
    this.handleQuestionChange = this.handleQuestionChange.bind(this)
    this.handleFocusQuestion = this.handleFocusQuestion.bind(this)
    this.handleBlurQuestion = this.handleBlurQuestion.bind(this)
    this.handleScriptChange = this.handleScriptChange.bind(this)
    // TODO can probably simplify these  into one or two methods that send the whole formsy form

    this.state = {
      script: props.interactionStep.script,
      questionIsFocused: false
    }
  }

  addAnswer() {
    const {onAddSurveyAnswer, interactionStep} = this.props
    onAddSurveyAnswer(interactionStep._id)
    const answers = interactionStep.allowedAnswers
  }

  handleQuestionChange(event) {
    const { interactionStep, onEditQuestion } = this.props
    onEditQuestion(interactionStep._id, { question: event.target.value })
  }

  handleScriptChange(event) {
    const { interactionStep, onEditQuestion } = this.props
    console.log("interactionStep", event.target.value)
    onEditQuestion(interactionStep._id, { script: event.target.value })
  }

  handleDeleteQuestion() {
    const {onDeleteQuestion, interactionStep} = this.props
    onDeleteQuestion(interactionStep._id)
  }


  handleDeleteScript(answer) {
    this.handleUpdateAnswer(answer._id, {script: null})
  }

  renderAnswers(interactionSteps, interactionStep, questionIsFocused) {
    const { onAddQuestion, onEditQuestion, onClickStepLink } = this.props
    const otherQuestions = _.reject(interactionSteps, (q) => q._id === interactionStep._id)
    const answers = interactionStep.allowedAnswers
    return (
      <div>
        { _.map(answers, (answer, index) => (
          <CampaignQuestionFormAnswerRow
            ref={`allowedAnswers[${index}]`}
            onAddAnswer={this.addAnswer}
            onClickStepLink={onClickStepLink}
            onDeleteAnswer={this.handleDeleteAnswer}
            onEditQuestion={onEditQuestion}
            otherQuestions={otherQuestions}
            interactionStep={interactionStep}
            answer={answer}
            autoFocus={index === answers.length - 1 && !questionIsFocused}
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



  handleFocusQuestion(event) {
    this.setState({ questionIsFocused: true})
    event.target.select()
  }

  handleBlurQuestion() {
    this.setState({ questionIsFocused: false })
  }

  renderQuestion() {
    const { interactionStep, interactionSteps, campaignStarted } = this.props
    const { questionIsFocused } = this.state
    return [
      <FormsyText
        name="interactionStep"
        floatingLabelText="Question"
        onChange={this.handleQuestionChange}
        onFocus={this.handleFocusQuestion}
        onBlur={this.handleBlurQuestion}
        fullWidth
        disabled={campaignStarted}
        ref="interactionStepInput"
        hintText="E.g. Can the contact attend the event?"
        value={ interactionStep.question }
      />,

      interactionStep.question ? this.renderAnswers(interactionSteps, interactionStep, questionIsFocused) : '',
    ]

  }

  render() {
    const { interactionStep, interactionStepIndex, campaignStarted } = this.props
    const cardActions = campaignStarted || interactionStep.isTopLevel ? '' : (
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

    const displayStep = (step) =>  <span style={step.question ? styles.questionSpan : styles.answerSpan }>{step.question ? step.question : step.value} > </span>

    const stepTitle = (step) => {
      console.log("interactionStepIndex", interactionStepIndex)

      const title = step.question || `This step`
      if (step.isTopLevel) {
        return ['Start: ', <span style={styles.stepTitle}>{title}</span>]
      } else {
        const parents = getAllParents(step)
        return [parents.map((step) => displayStep(step)), <span style={styles.stepTitle}>{title}</span>]
      }

    }

    return (
      <Card style={styles.interactionStep}>
        <CardHeader
          style={styles.cardHeader}
          title={stepTitle(interactionStep)}
          subtitle={interactionStep.isTopLevel ? "Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact." : ''}
        />
        <Divider/>

        <CardText style={styles.cardText}>
          <div>
            <ScriptField
              customFields={['hi', 'hi2']}
              name="text"
              floatingLabelText="Script"
              value={ interactionStep.script }
              multiLine
              required
              hintText="Hi, {firstName}. It's {texterFirstName} here."
              fullWidth
            />
            {this.renderQuestion() }
          </div>
        </CardText>
        <Divider/>
        {cardActions}
      </Card>
    )
  }
}
