import React, { Component } from 'react'
import { CampaignFormSection } from './campaign_form_section'
import { grey50 } from 'material-ui/styles/colors'

import {
  Step,
  Stepper,
  StepLabel
} from 'material-ui/Stepper'

const styles = {
  stepContent: {
    marginTop: 56,
    paddingBottom: 60
  },
  stepper: {
    backgroundColor: grey50,
    padding: '25 10',
    bottom: 0,
    right: 0,
    left: 0,
    height: 56,
    position: 'fixed'
  }
}



export class CampaignNewForm extends Component {
  constructor(props) {
    super(props)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrev = this.handlePrev.bind(this)
    this.state = {
      stepIndex: 0
    }
  }
  // NAVIGATION
  lastStepIndex() {
    const { steps } = this.props
    return steps.length - 1
  }

  handleNext() {
    const { onSubmit } = this.props
    const { stepIndex } = this.state
    if (stepIndex === this.lastStepIndex()) {
      onSubmit()
    }
    else {
      this.setState({ stepIndex: stepIndex + 1 })
    }
  }

  handlePrev() {
    const { stepIndex } = this.state
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 })
    }
  }

  stepContent(stepIndex) {
    const { steps } = this.props
    const { content } = steps[stepIndex]
    return this.renderFormStepSection(content())
  }

  renderFormStepSection(content) {
    const { stepIndex } = this.state

    return (
      <CampaignFormSection
        previousStepEnabled={(stepIndex !== 0)}
        content={content}
        onPrevious={this.handlePrev}
        showPreviousStep
        onNext={this.handleNext}
        nextStepLabel={stepIndex === this.lastStepIndex() ? 'Finish' : 'Next'}
      />
    )
  }

  render() {
    const { stepIndex } = this.state
    const { steps } = this.props
    return (
      <div>
        <div style={styles.stepContent} >
          {this.stepContent(stepIndex)}
        </div>
        <Stepper
          style={styles.stepper}
          activeStep={stepIndex}
        >
          {steps.map(({ title }) => (
            <Step>
              <StepLabel>{title}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>
    )
  }
}

CampaignNewForm.propTypes = {
  steps: React.PropTypes.array,
  onSubmit: React.PropTypes.func
}
