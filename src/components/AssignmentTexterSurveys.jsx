import React, { Component } from 'react'
import PropTypes from 'prop-types'

import grey from '@material-ui/core/colors/grey';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import Select from '@material-ui/core/Select';

const styles = {
  root: {
  },
  card: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: grey[50],
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
        <Select
          style={isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect}
          onChange={(event, index, value) => this.handleSelectChange(step, index, value)}
          name={question.id}
          fullWidth={true}
          value={responseValue}
          floatingLabelText={question.text}
          hintText='Choose answer'
        >
          {this.renderAnswers(step)}
        </Select>
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
        <CardContent
          style={styles.cardText}
        >
          {showAllQuestions ? '' : this.renderStep(currentInteractionStep, true)}
        </CardContent>
        <CardContent
          style={styles.cardText}
          expandable
        >
          {interactionSteps.map((step) => (
            this.renderStep(step, step.id === currentInteractionStep.id)
          ))}
        </CardContent>
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
