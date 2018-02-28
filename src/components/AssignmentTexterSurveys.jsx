import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { grey50 } from 'material-ui/styles/colors'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import SelectField from 'material-ui/SelectField'

const styles = {
  root: {
  },
  card: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: grey50,
    padding: 10
  },
  cardHeader: {
    padding: 0
  },
  cardText: {
    padding: 0
  }
}
class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showAllQuestions: false
    }
  }

  getNextScript({ interactionStep, answerIndex }) {
    const answerOption = interactionStep.question.answerOptions[answerIndex]

    const { nextInteractionStep } = answerOption
    return nextInteractionStep ? nextInteractionStep.script : null
  }

  handleExpandChange = (newExpandedState) => {
    this.setState({ showAllQuestions: newExpandedState })
  }

  handlePrevious = () => {
    const { stepIndex } = this.state
    this.setState({
      stepIndex: stepIndex - 1
    })
  }

  handleNext = () => {
    const { stepIndex } = this.state
    this.setState({
      stepIndex: stepIndex + 1
    })
  }

  handleSelectChange = async (interactionStep, answerIndex, value) => {
    const { onQuestionResponseChange } = this.props
    let questionResponseValue = null
    let nextScript = null

    if (value !== 'clearResponse') {
      questionResponseValue = value
      nextScript = this.getNextScript({ interactionStep, answerIndex })
    }

    onQuestionResponseChange({
      interactionStep,
      questionResponseValue,
      nextScript
    })
  }

  renderAnswers(step) {
    const menuItems = step.question.answerOptions.map(answerOption =>
      <MenuItem
        key={answerOption.value}
        value={answerOption.value}
        primaryText={answerOption.value}
      />
    )

    menuItems.push(<Divider />)
    menuItems.push(
      <MenuItem
        key='clear'
        value='clearResponse'
        primaryText='Clear response'
      />
    )

    return menuItems
  }


  renderStep(step, isCurrentStep) {
    const { questionResponses } = this.props
    const responseValue = questionResponses[step.id]
    const { question } = step

    return question.text ? (
      <div>
        <SelectField
          style={isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect}
          onChange={(event, index, value) => this.handleSelectChange(step, index, value)}
          name={question.id}
          fullWidth
          value={responseValue}
          floatingLabelText={question.text}
          hintText='Choose answer'
        >
          {this.renderAnswers(step)}
        </SelectField>
      </div>
    ) : ''
  }

  render() {
    const { interactionSteps, currentInteractionStep } = this.props

    const { showAllQuestions } = this.state
    return interactionSteps.length === 0 ? null : (
      <Card
        style={styles.card}
        onExpandChange={this.handleExpandChange}
      >
        <CardHeader
          style={styles.cardHeader}
          title={showAllQuestions ? 'All questions' : 'Current question'}
          showExpandableButton={interactionSteps.length > 1}
        />
        <CardText
          style={styles.cardText}
        >
          {showAllQuestions ? '' : this.renderStep(currentInteractionStep, true)}
        </CardText>
        <CardText
          style={styles.cardText}
          expandable
        >
          {interactionSteps.map((step) => (
            this.renderStep(step, step.id === currentInteractionStep.id)
          ))}
        </CardText>
      </Card>
    )
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: PropTypes.object,
  interactionSteps: PropTypes.array,
  currentInteractionStep: PropTypes.object,
  questionResponses: PropTypes.object,
  onQuestionResponseChange: PropTypes.func
}

export default AssignmentTexterSurveys
