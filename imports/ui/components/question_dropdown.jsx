import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'
import Divider from 'material-ui/Divider'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'

const styles = {
  previousStep: {
    fontSize: 16,
    verticalAlign: 'middle'
  },
  currentStep: {
    // fontSize: 16,
  },
  currentStepSelect: {
    fontSize: 16,
    color: 'red',
  },
  previousStepSelect: {
    fontSize: 16,
    opacity: 0.8
    // fontSize: 16
  },
  previousStepLabel: {
    fontSize: 16
  },
  currentStepLabel: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold'
  },
}
export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleAnswerChange = this.handleAnswerChange.bind(this)
  }

  handleAnswerChange(event, index, value) {
    const { onAnswerChange, step } = this.props

    if (value === 'clearResponse') {
      onAnswerChange(step._id, null, null)
    } else {
      const interactionStepId = step.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).interactionStepId
      const nextStep = InteractionSteps.findOne({ _id: interactionStepId })
      onAnswerChange(step._id, value, nextStep ? nextStep.script : null)
    }
  }

  renderAnswers() {
    const { step } = this.props
    const menuItems = step.allowedAnswers.map(allowedAnswer =>
      <MenuItem
        key={allowedAnswer.value}
        value={allowedAnswer.value}
        primaryText={allowedAnswer.value}
      />
    )

    menuItems.push(<Divider/>)
    menuItems.push(
      <MenuItem
        key='clear'
        value='clearResponse'
        primaryText='Clear response'
        onTouchTap={(event) => this.handleAnswerDelete(event, step._id)}
      />
    )

    console.log("menuitems", menuItems)
    return menuItems
  }
  render () {
    const { step, answerValue, isCurrentStep } = this.props
    if (!step.question){
      return null
    } else {
      return (
        <div>
            <SelectField
              style={isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect}
              onChange={this.handleAnswerChange}
              name={step.question}
              value={answerValue}
              floatingLabelText={step.question}
              hintText="Choose answer"
            >
              { this.renderAnswers() }
            </SelectField>
        </div>
      )
    }

  }
}


QuestionDropdown.propTypes = {
  onAnswerChange: React.PropTypes.function,
  step: React.PropTypes.object,
  answerValue: React.PropTypes.object,
  isCurrentStep: React.PropTypes.boolean
}
