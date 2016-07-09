import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'
import Divider from 'material-ui/Divider'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'

const styles = {
  previousStep: {
    fontSize: 12,
    verticalAlign: 'middle'
  },
  currentStep: {
    fontSize: 12
  },
  previousStepSelect: {
    marginLeft: 12,
    fontSize: 12
  }
}
export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleAnswerChange = this.handleAnswerChange.bind(this)
    this.handleAnswerDelete = this.handleAnswerDelete.bind(this)
  }

  handleAnswerChange(event, index, value) {
    const { onAnswerChange, step } = this.props
    const interactionStepId = step.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).interactionStepId
    const nextStep = InteractionSteps.findOne({ _id: interactionStepId })
    onAnswerChange(step._id, value, nextStep ? nextStep.script : null)
  }

  handleAnswerDelete() {
    const { onAnswerDelete, step } = this.props
    onAnswerDelete(step._id)
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
        value='clear'
        primaryText='Clear response'
        onTouchTap={() => this.handleAnswerDelete(step._id)}
      />
    )

    console.log("menuitems", menuItems)
    return menuItems
  }
  render () {
    const { step, answerValue, isCurrentStep } = this.props
    if (!step.question){
      return null
    } else if (isCurrentStep) {
      return (
        <div style={styles.currentStep}>
          <SelectField
            floatingLabelText={step.question}
            floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
            onChange={this.handleAnswerChange}
            underlineStyle={{display: 'none'}}
            name={step.question}
            value={answerValue}
          >
            { this.renderAnswers() }
          </SelectField>
          <Divider/>
        </div>
      )
    } else {
      return (
        <div style={styles.previousStep}>
          <span>{step.question}</span>
          <SelectField
            style={styles.previousStepSelect}
            floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
            onChange={this.handleAnswerChange}
            name={step.question}
            value={answerValue}
          >
            { this.renderAnswers() }
          </SelectField>
          <Divider/>
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
