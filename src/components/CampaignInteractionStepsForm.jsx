import React, { PropTypes as type } from 'react'
import ReactDOM from 'react-dom'
import Divider from 'material-ui/Divider'
import ContentClear from 'material-ui/svg-icons/content/clear'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import RadioButtonUnchecked from 'material-ui/svg-icons/toggle/radio-button-unchecked'
import IconButton from 'material-ui/IconButton'
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import theme from '../styles/theme'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import ForwardIcon from 'material-ui/svg-icons/navigation/arrow-forward'
import Form from 'react-formal'
import GSForm from './forms/GSForm'
import yup from 'yup'
import {
  sortInteractionSteps,
  getInteractionPath,
  getChildren,
  findParent
} from '../lib'

const styles = {
  icon: {
    width: 18,
    height: 18
  },
  button: {
    width: 22,
    height: 18
  },
  scriptRow: {
    borderLeft: `5px solid ${theme.colors.green}`
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
    borderLeft: `5px solid ${theme.colors.green}`,
    marginBottom: 24
  },
  followUp: {
    borderLeft: `5px solid ${theme.colors.orange}`,
    marginLeft: 24,
    marginBottom: 24
  },
  radioButtonIcon: {
    height: '14px',
    verticalAlign: 'middle'
  },
  addAnswerButton: {
    textTransform: 'none',
    paddingLeft: 0,
    fontSize: 12
  },
  scriptInput: {
    fontSize: 12
  },
  cardHeader: {
    backgroundColor: theme.colors.veryLightGray
  },
  cardText: {
    marginBottom: 48
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

export default class CampaignInteractionStepsForm extends React.Component {
  sortedValues() {
    return {
      interactionSteps: sortInteractionSteps(this.props.formValues.interactionSteps)
    }
  }

  componentDidUpdate() {
    if (this.scrollStepId) {
      this.scrollToStep(this.scrollStepId)
      this.scrollStepId = null
    }
  }

  formSchema = yup.object({
    interactionSteps: yup.array().of(yup.object({
      script: yup.string(),
      question: yup.object({
        text: yup.string(),
        answerOptions: yup.array().of(yup.object({
          value: yup.string(),
          nextInteractionStep: yup.mixed()
        }))
      })
    }))
  })

  state = {
    focusedField: null
  }

  handleNavigateToStep = (interactionStepId) => {
    this.scrollToStep(interactionStepId)
  }

  scrollToStep(interactionStepId) {
    const node = ReactDOM.findDOMNode(this.refs[interactionStepId])
    node.scrollIntoView()
  }

  modifyInteractionStep(interactionStep, newProps) {
    const newSteps = JSON.parse(JSON.stringify(this.sortedValues().interactionSteps)).map((step) => {
      if (step.id === interactionStep.id) {
        return {
          ...interactionStep,
          ...newProps
        }
      }
      return step
    })

    this.onChange({
      interactionSteps: newSteps
    })
  }

  addAnswer(interactionStep, interactionStepIndex) {
    const newQuestion = JSON.parse(JSON.stringify(interactionStep.question))

    newQuestion.answerOptions.push({
      value: '',
      nextInteractionStep: null
    })
    let answerOptionIndex = newQuestion.answerOptions.length - 1
    this.modifyInteractionStep(interactionStep, { question: newQuestion })
    this.setState({ focusedField: `interactionSteps[${interactionStepIndex}]['question']['answerOptions'][${answerOptionIndex}].value` })
  }

  addStep(interactionStep, answer) {
    const newId = Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')
    const newSteps = JSON.parse(JSON.stringify(this.sortedValues())).interactionSteps
    newSteps.forEach((step) => {
      if (step.id === interactionStep.id) {
        step.question.answerOptions.forEach((option) => {
          if (option.value === answer.value) {
            option.nextInteractionStep = {
              id: newId
            }
          }
        })
      }
    })
    newSteps.push({
      id: newId,
      script: '',
      question: {
        text: '',
        answerOptions: []
      }
    })

    this.onChange({
      interactionSteps: newSteps
    })
  }

  onChange = (formValues) => {
    if (this.props.ensureComplete) {
      return
    }
    const newValues = JSON.parse(JSON.stringify(formValues))
    newValues.interactionSteps.forEach((step) => {
      if (step.question && step.question.text === '') {
        step.question.answerOptions = []
      } else if (step.question && step.question.text !== '' && step.question.answerOptions.length === 0) {
        step.question.answerOptions = [{
          value: '',
          nextInteractionStep: null
        }]
      }
    })
    this.props.onChange(newValues)
  }

  renderAnswer(answer, answerOptionIndex, interactionStep, interactionStepIndex) {
    let fieldName = `interactionSteps[${interactionStepIndex}]['question']['answerOptions'][${answerOptionIndex}].value`

    let deleteAnswerButton = (
      <IconButton
        style={{ width: 42, height: 42, verticalAlign: 'middle' }}
        iconStyle={{ width: 20, height: 20 }}
        onTouchTap={() => {
          const newQuestion = JSON.parse(JSON.stringify(interactionStep.question))
          let removeIndex = null
          for (let index = 0; index < newQuestion.answerOptions.length; index++) {
            if (newQuestion.answerOptions[index].value === answer.value) {
              removeIndex = index
              break
            }
          }
          if (removeIndex !== null) {
            newQuestion.answerOptions.splice(removeIndex, 1)
          }
          if (this.state.focusedField === fieldName) {
            this.setState({ focusedField: null })
          }
          this.modifyInteractionStep(interactionStep, { question: newQuestion })
        }}
      >
        <ContentClear />
      </IconButton>
    )

    let addNextQuestionButton = (
      <RaisedButton
        label='Link to next step'
        onTouchTap={() => this.addStep(interactionStep, answer)}
      />
    )

    if (this.props.ensureComplete) {
      deleteAnswerButton = ''
      addNextQuestionButton = ''
    }

    return (
      <div
        style={{
          marginTop: 16,
          marginBottom: 16
        }}
      >
        <div style={{
          display: 'inline-block',
          marginRight: 16
        }}>
          <RadioButtonUnchecked
            style={{
              height: 14,
              verticalAlign: 'middle'
            }}
          />
          <Form.Field
            name={fieldName}
            inputStyle={{
              fontSize: 12
            }}
            hintStyle={{
              fontSize: 12
            }}
            ref={fieldName}
            autoFocus={this.state.focusedField === fieldName}
            hintText='Answer'
            // noValidate here otherwise we end up with this bug: https://github.com/AxleFactory/spoke/issues/25
            noValidate
            onKeyDown={(event) => {
              if (event.keyCode === 13) {
                this.addAnswer(interactionStep, interactionStepIndex)
                event.preventDefault()
              }
            }}
          />
          {deleteAnswerButton}
        </div>
        <div style={{
          display: 'inline-block'
        }}>
       {answer.nextInteractionStep ? (
          <FlatButton
            label='Next Step'
            secondary
            onTouchTap={() => this.handleNavigateToStep(answer.nextInteractionStep.id)}
            icon={<ForwardIcon />}
          />
          ) : addNextQuestionButton}
        </div>
      </div>
    )
  }

  renderAnswers(interactionStep, interactionStepIndex) {
    return (
      <div>
        {
          interactionStep.question
            .answerOptions
            .map((answer, index) => this.renderAnswer(answer, index, interactionStep, interactionStepIndex))
        }
        {!this.props.ensureComplete ? (
          <div>
            <RadioButtonUnchecked
              style={styles.radioButtonIcon}
            />
            <FlatButton
              style={styles.addAnswerButton}
              labelStyle={styles.addAnswerButton}
              label='Add another answer'
              onTouchTap={() => this.addAnswer(interactionStep, interactionStepIndex)}
            />
          </div>
        ) : ''}
      </div>
    )
  }

  renderStep(interactionStep, index) {
    const parents = getInteractionPath(interactionStep, this.sortedValues().interactionSteps)
    const isTopLevel = parents.length === 0
    const cardActions = isTopLevel ? '' : (
      <div>
        <Divider />
        <CardActions
          style={{ textAlign: 'right' }}
        >
          <IconButton
            iconStyle={styles.icon}
            style={styles.icon}
            onTouchTap={() => {
              const newSteps = []
              const allSteps = this.sortedValues().interactionSteps
              const children = getChildren(interactionStep, allSteps).map((ele) => ele.id)
              const stepParent = JSON.parse(JSON.stringify(findParent(interactionStep, allSteps)))
              stepParent.question.answerOptions.forEach((option) => {
                if (option.nextInteractionStep && option.nextInteractionStep.id === interactionStep.id) {
                  option.nextInteractionStep = null
                }
              })

              allSteps.forEach((step) => {
                if (children.indexOf(step.id) === -1 && interactionStep.id !== step.id) {
                  if (step.id === stepParent.id) {
                    newSteps.push(stepParent)
                  } else {
                    newSteps.push(step)
                  }
                }
              })

              this.onChange({
                interactionSteps: newSteps
              })
            }}
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </div>
    )

    const displayStep = (step) => (
      <span
        style={step.question && step.question.text ? styles.questionSpan : styles.answerSpan}
      >
        {step.question && step.question.text ? `${step.question.text}>${step.answerLink}` : ''}>
      </span>
    )

    const stepTitle = (step) => {
      const title = step.question && step.question.text ? step.question.text : 'This step'
      if (isTopLevel) {
        return ['Start: ', <span style={styles.stepTitle}>{title}</span>]
      }
      return [
        parents.map((parentStep) => displayStep(parentStep)),
        <span style={styles.stepTitle}>{title}</span>
      ]
    }
    return (
      <Card
        style={styles.interactionStep}
        ref={interactionStep.id}
        key={interactionStep.id}
      >
        <CardHeader
          style={styles.cardHeader}
          title={stepTitle(interactionStep)}
          subtitle={isTopLevel ? 'Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact.' : ''}
        />
        <Divider />
        <CardText style={styles.cardText}>
          <div>
            <Form.Field
              name={`interactionSteps[${index}].script`}
              type='script'
              fullWidth
              customFields={this.props.customFields}
              label='Script'
              multiline
              hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
            />
            <Form.Field
              name={`interactionSteps[${index}]['question'].text`}
              label='Question'
              fullWidth
              hintText='A question for texters to answer. E.g. Can this person attend the event?'
            />
            {interactionStep.question && interactionStep.question.text ? this.renderAnswers(interactionStep, index) : ''}
          </div>
        </CardText>
        <Divider />
        {cardActions}
      </Card>
    )
  }

  render() {
    let subtitle = 'You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity.'
    if (this.props.ensureComplete) {
      subtitle = 'This campaign has already started, so you won\'t be able to modify the survey questions. You can still modify the scripts, though.'
    }
    return (
      <div>
        <CampaignFormSectionHeading
          title='What do you want to discuss?'
          subtitle={subtitle}
        />
        <GSForm
          schema={this.formSchema}
          value={this.sortedValues()}
          onChange={this.onChange}
          onSubmit={this.props.onSubmit}
        >
          {this.sortedValues().interactionSteps.map((interactionStep, index) => (
            this.renderStep(interactionStep, index)
          ))}
          {this.props.ensureComplete ? '' : <Form.Button
            type='submit'
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
          />}
        </GSForm>
      </div>
    )
  }
}

CampaignInteractionStepsForm.propTypes = {
  formValues: type.object,
  onChange: type.func,
  ensureComplete: type.bool,
  onSubmit: type.func,
  customFields: type.array,
  saveLabel: type.string,
  saveDisabled: type.bool
}

