import React, { Component } from 'react'
import { QuestionDropdown } from './question_dropdown'
import { updateAnswer } from '../../api/survey_answers/methods'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton/IconButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import { grey200 } from 'material-ui/styles/colors'

const getAllChildren = (parentStep) => {
  let allChildren  = []

  console.log("PARENT STEP", parentStep)

  const getChildren = (step) => {
    let children = step.allowedAnswers.map((allowedAnswer) => InteractionSteps.findOne(allowedAnswer.interactionStepId))
    children = _.compact(children)
    allChildren = allChildren.concat(children)
    _.each(children, (step) => getChildren(step))

  }

  getChildren(parentStep)

  return allChildren
}

const styles = {
  root: {
    padding: '0px 20px',
    backgroundColor: grey200
  }
}
export class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrevious = this.handlePrevious.bind(this)
    // TODO this should actually happen only when the contact changes
    console.log("this.getAnswersState", this.getAnswersState())
    this.state = this.getAnswersState()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.contact !== this.props.contact) {
      this.setState(this.getAnswersState())
    }
  }

  getAnswersState() {
    const { contact } = this.props
    let answers = SurveyAnswers.find({ campaignContactId: contact._id, campaignId: contact.campaignId }).fetch()
    let newAnswers = {}
    _.each(answers, (answer) => newAnswers[answer.interactionStepId] = answer.value )
    return { answers: newAnswers }

  }

  steps() {
    const { initialStep } = this.props
    let step = initialStep

    const steps = []
    while (step) {
      steps.push(step)

      const answerValue = this.state.answers[step._id]
      if (answerValue) {
        const nextStepId = step.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === answerValue).interactionStepId
        step = InteractionSteps.findOne(nextStepId)
      }
      else {
        step = null
      }
    }

    return steps
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

  answers() {
    console.log("this.state.answers", this.state.answers)
    return this.state.answers
  }

  handleSurveyAnswerChange(interactionStepId, answer, script) {
    const { contact, onScriptChange } = this.props

    onScriptChange(script)

    const answers = this.state.answers
    answers[interactionStepId] = answer


    const step = InteractionSteps.findOne(interactionStepId)
    const children = getAllChildren(step)
    _.each(children, (childStep) => delete answers[childStep._id])
    this.setState( { answers })
  }


  render() {
    const { answers } = this.state
    const steps = this.steps()

    console.log("steps", steps)
    return (
      <div style={styles.root}>
        { _.map(steps, (step, index) => (
          <QuestionDropdown
            isCurrentStep={index===steps.length - 1}
            answerValue={answers[step._id]}
            onAnswerChange={this.handleSurveyAnswerChange.bind(this)}
            step={step}
          />
        ))}
      </div>
    )
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: React.PropTypes.object,      // current assignment
  questions: React.PropTypes.array,   // contacts for current assignment
}


