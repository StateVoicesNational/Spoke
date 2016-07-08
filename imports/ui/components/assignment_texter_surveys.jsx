import React, { Component } from 'react'
import { QuestionDropdown } from './question_dropdown'
import { updateAnswer } from '../../api/survey_answers/methods'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton/IconButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'

const styles = {
  root: {
    padding: '0px 20px',
  }
}
export class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrevious = this.handlePrevious.bind(this)
    this.state = {
      stepIndex: 0
    }
  }

  getCurrentStep() {
    const { initialStep, contact } = this.props
    let step = initialStep

    let steps = []
    let stepIndex = 0
    while (step) {
      steps.push(step)

      const answer = contact.surveyAnswer(step._id)
      if (answer) {
        step = InteractionSteps.findOne(answer.interactionStepId)
        console.log("found step", step, answer.interactionStepId)
        console.log("and answer", answer)
        stepIndex++
      }
      else {
        step = null
      }
    }

    console.log("stepIndex", stepIndex)
    console.log("steps", steps)
  }



  handleNext() {
    const {stepIndex} = this.state
    this.setState({
      stepIndex: stepIndex + 1,
    })
  }

  handlePrevious() {
    const {stepIndex} = this.state
    this.setState({
      stepIndex: stepIndex - 1,
    })
  }

  handleSurveyAnswerChange(interactionStepId, answer, script) {
    const { contact, onScriptChange } = this.props
    updateAnswer.call({
      interactionStepId,
      value: answer,
      campaignContactId: contact._id,
      campaignId: contact.campaignId
    }, (err) => {
      if (err) {
        alert(err)
      } else {
        // This should actually happen from propagating props
        onScriptChange(script)
      }
    })

  }

  renderCurrentQuestion() {
    const { contact, initialStep } = this.props
    const { stepIndex } = this.state

    const steps = [initialStep]
    this.getCurrentStep()
    const step = steps[stepIndex]
    return (
      <QuestionDropdown
        answer={contact.surveyAnswer(step._id)}
        onAnswerChange={this.handleSurveyAnswerChange.bind(this)}
        step={step}
      />
    )
  }

  render() {
    const { contact, initialStep } = this.props
    return !initialStep ? <div /> : (
      <div style={styles.root}>
        {this.renderCurrentQuestion()}
        <IconButton onTouchTap={this.handlePrevious}>
          <NavigateBeforeIcon />
        </IconButton> ,
        <IconButton onTouchTap={this.handleNext} >
          <NavigateNextIcon />
        </IconButton>
      </div>

    )
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: React.PropTypes.object,      // current assignment
  questions: React.PropTypes.array,   // contacts for current assignment
}


