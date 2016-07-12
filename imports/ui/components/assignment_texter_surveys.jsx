import React, { Component } from 'react'
import { QuestionDropdown } from './question_dropdown'
import { updateAnswer } from '../../api/survey_answers/methods'
import { SurveyAnswers } from '../../api/survey_answers/survey_answers'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'
import Divider from 'material-ui/Divider'
import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton'
import NavigateBeforeIcon from 'material-ui/svg-icons/image/navigate-before'
import NavigateNextIcon from 'material-ui/svg-icons/image/navigate-next'
import { grey100 } from 'material-ui/styles/colors'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';

const getAllChildren = (parentStep) => {
  let allChildren  = []


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
    // padding: '0px 20px',
    backgroundColor: grey100
  }
}
export class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrevious = this.handlePrevious.bind(this)
    this.handleExpandChange = this.handleExpandChange.bind(this)
    // TODO this should actually happen only when the contact changes
    this.state = _.extend({ showAllQuestions: false }, this.getAnswersState())
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
    const { initialStep, contact } = this.props
    let step = initialStep

    let answers = SurveyAnswers.find({ campaignContactId: contact._id, campaignId: contact.campaignId }).fetch()

    let currentStep = null
    const steps = []
    while (step) {
      steps.push(step)

      if (!currentStep && !contact.surveyAnswer(step._id)) {
        currentStep = step
      }

      const answerValue = this.state.answers[step._id]
      if (answerValue) {
        const nextStepId = step.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === answerValue).interactionStepId
        step = InteractionSteps.findOne(nextStepId)
      }
      else {
        step = null
      }
    }

    return {
      steps,
      currentStep
    }
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
    return this.state.answers
  }

  handleExpandChange(newExpandedState) {
    this.setState( { showAllQuestions: newExpandedState })
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

  renderStep(step) {
    const { answers } = this.state

    return (
      <QuestionDropdown
        isCurrentStep={false}
        answerValue={answers[step._id]}
        onAnswerChange={this.handleSurveyAnswerChange.bind(this)}
        step={step}
      />
    )
  }
  render() {
    const { steps, currentStep } = this.steps()

    const otherSteps = steps.filter((step) => step._id !== currentStep._id)
    const { showAllQuestions } = this.state
    return (
      <div style={styles.root}>
        <Card
          onExpandChange={this.handleExpandChange}
        >
          <CardHeader
            title={showAllQuestions ? 'All survey questions' : 'Current survey question'}
            showExpandableButton={otherSteps.length > 0}
          >
            {showAllQuestions ? '' : this.renderStep(currentStep)}
          </CardHeader>
          <CardText expandable={true}>
            {_.map(showAllQuestions ? steps : otherSteps, (step, index) => this.renderStep(step))}
          </CardText>
        </Card>
      </div>
    )
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: React.PropTypes.object,      // current assignment
  questions: React.PropTypes.array,   // contacts for current assignment
}


