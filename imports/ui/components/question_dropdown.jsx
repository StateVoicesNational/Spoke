import React, { Component } from 'react'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Formsy from 'formsy-react';
import { FormsySelect } from 'formsy-material-ui/lib'
import Divider from 'material-ui/Divider'
import { InteractionSteps } from '../../api/interaction_steps/interaction_steps'

const styles = {
}

export class QuestionDropdown extends Component {
  constructor(props) {
    super(props)
    this.handleAnswerChange = this.handleAnswerChange.bind(this)
  }

  handleAnswerChange(event, index, value) {
    const { onAnswerChange, step } = this.props
    const interactionStepId = step.allowedAnswers.find((allowedAnswer) => allowedAnswer.value === value).interactionStepId
    const nextStep = InteractionSteps.findOne({ _id: interactionStepId })
    onAnswerChange(step._id, value, nextStep ? nextStep.script : null)
  }

  render () {
    const { step, answer } = this.props
    return (
      <div style={styles.form}>
        <SelectField
          floatingLabelText={step.question}
          floatingLabelStyle={{pointerEvents: 'none'}} // https://github.com/callemall/material-ui/issues/3908
          onChange={this.handleAnswerChange}
          underlineStyle={{display: 'none'}}
          underlineShow={false}
          name={step.question}
          value={answer ? answer.value : ''}
        >
          {step.allowedAnswers.map(allowedAnswer =>
            <MenuItem
              key={allowedAnswer.value}
              value={allowedAnswer.value}
              primaryText={allowedAnswer.value}
            />)}
        </SelectField>
        <Divider/>
      </div>
    )
  }
}


QuestionDropdown.propTypes = {
  onAnswerChange: React.PropTypes.function,
  step: React.PropTypes.object,
  answer: React.PropTypes.object
}
