import type from 'prop-types'
import React from 'react'
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
import CampaignOSDIQuestionFetcher from './CampaignOSDIQuestionFetcher'
import ForwardIcon from 'material-ui/svg-icons/navigation/arrow-forward'
import HelpIcon from 'material-ui/svg-icons/action/help'
import HelpIconOutline from 'material-ui/svg-icons/action/help-outline'
import Form from 'react-formal'
import GSForm from './forms/GSForm'
import yup from 'yup'
import {
  sortInteractionSteps,
  getInteractionPath,
  getChildren,
  findParent,
  makeTree
} from '../lib'

const styles = {
  pullRight: {
    float: 'right',
    position: 'relative',
    top: '10px',
    icon: 'pointer'
  },

  cardHeader: {
    backgroundColor: theme.colors.veryLightGray
  },

  interactionStep: {
    borderLeft: `5px solid ${theme.colors.green}`,
    marginBottom: 24
  },

  answerContainer: {
    marginLeft: '35px',
    marginTop: '10px',
    borderLeft: `3px dashed ${theme.colors.veryLightGray}`
  }
}

export default class CampaignInteractionStepsForm extends React.Component {

  state = {
    focusedField: null,
    interactionSteps: this.props.formValues.interactionSteps[0] ? this.props.formValues.interactionSteps : [{ id: 'newId', parentInteractionId: null, questionText: '', answerOption: '', script: '', answerActions: '', isDeleted: false }]
  }

  onSave = async () => {
    await this.props.onChange({ interactionSteps: makeTree(this.state.interactionSteps) })
    this.props.onSubmit()
  }

  mapOSDIQuestion(interactionStepId, { questionText, questionId, source, responses }) {
    console.log('mapOSDIQuestion called on interaction step id', interactionStepId, 'with responses', responses)
    /*
    interactionStepId is the ID of the interaction step whose Question field should be set to the text of the mapped OSDI question. Second argument is an object describing the OSDI question to be mapped.
    */
    // First, set some attributes on the base interaction step
    this.setState(prevState => {
      const newInteractionSteps = prevState.interactionSteps.map(iS => Object.assign({}, iS))
      const targetInteractionStepIndex = newInteractionSteps.findIndex(is => is.id === interactionStepId)
      console.log('computed index', targetInteractionStepIndex, 'for base interaction step')
      const targetInteractionStep = newInteractionSteps[targetInteractionStepIndex]
      targetInteractionStep.questionText = questionText
      targetInteractionStep.source = source
      targetInteractionStep.externalQuestionId = questionId
      return { interactionSteps: newInteractionSteps }
    })
    // Add interaction steps for each of the provided responses
    responses.forEach(response => {
      console.log('adding response', response, 'to question', interactionStepId)
      const { key, title } = response
      const interactionStepOptions = {
        answerActions: 'osdi-survey-question',
        externalResponseId: key,
        answerOption: title,
        source: 'OSDI'
      }
      this.addStep(interactionStepId, interactionStepOptions)
    })
  }

  addStep(parentInteractionId, options = {}) {
    // Set up interaction step attributes, including defaults.
    const {
      answerActions = '',
      answerOption = '',
      id = 'new' + Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, ''),
      isDeleted = false,
      questionText = '',
      script = '',
      source = '',
      externalQuestionId = '',
      externalResponseId = ''
    } = options
    console.log('add step with parent', parentInteractionId, 'and computed options', {
      parentInteractionId,
      answerActions,
      answerOption,
      id,
      isDeleted,
      questionText,
      script,
      source,
      externalQuestionId,
      externalResponseId
    })
    this.setState(prevState => ({
      interactionSteps: [
        ...prevState.interactionSteps,
        {
          parentInteractionId,
          answerActions,
          answerOption,
          id,
          isDeleted,
          questionText,
          script,
          source,
          externalQuestionId,
          externalResponseId
        }
      ]
    }))
  }

  deleteStep(id) {
    return () => {
      this.setState({
        interactionSteps: this.state.interactionSteps.map((is) => {
          if (is.id == id) {
            is.isDeleted = true
            this.state.interactionSteps.filter((isp) => isp.parentInteractionId === is.id).map((isp) => {
              this.deleteStep(isp.id)
            })
          }
          return is
        })
      })
    }
  }

  handleFormChange(event) {
    this.setState({
      interactionSteps: this.state.interactionSteps.map((is) => {
        if (is.id == event.id) {
          delete event.interactionSteps
          return event
        } else {
          delete event.interactionSteps
          return is
        }
      })
    })
  }

  formSchema = yup.object({
    script: yup.string(),
    questionText: yup.string(),
    answerOption: yup.string(),
    answerActions: yup.string()
  })

  renderInteractionStep(interactionStep, title = 'Start') {
    return (<div>
      <Card
        style={styles.interactionStep}
        ref={interactionStep.id}
        key={interactionStep.id}
      >
        <CardHeader
          style={styles.cardHeader}
          title={title}
          subtitle={interactionStep.parentInteractionId ? '' : 'Enter a script for your texter along with the question you want the texter be able to answer on behalf of the contact.'}
        />
        <CardText>
          <GSForm
            schema={this.formSchema}
            value={interactionStep}
            onChange={this.handleFormChange.bind(this)}
          >
            {interactionStep.parentInteractionId ? <Form.Field
              name='answerOption'
              label='Answer'
              fullWidth
              disabled={interactionStep.source === 'OSDI'}
              hintText='Answer to the previous question'
                                                   /> : ''}
            {interactionStep.parentInteractionId ? <DeleteIcon style={styles.pullRight} onTouchTap={this.deleteStep(interactionStep.id).bind(this)} /> : ''}
            {interactionStep.parentInteractionId && this.props.availableActions && this.props.availableActions.length ?
              (<div key={`answeractions-${interactionStep.id}`}>
                <Form.Field
                  name='answerActions'
                  type='select'
                  default=''
                  disabled={interactionStep.source === 'OSDI'}
                  choices={[
                    { 'value': '', 'label': 'Action...' },
                    ...this.props.availableActions.map(
                      action => ({ 'value': action.name, 'label': action.display_name })
                    )
                  ]}
                />
                <IconButton
                  tooltip='An action is something that is triggered by this answer being chosen, often in an outside system'
                >
                  <HelpIconOutline />
                </IconButton>
                <div>
                  {
                    interactionStep.answerActions
                      ? this.props.availableActions.filter((a) => a.name === interactionStep.answerActions)[0].instructions
                      : ''}
                </div>
              </div>)
            : ''}
            <Form.Field
              name='script'
              type='script'
              fullWidth
              customFields={this.props.customFields}
              label='Script'
              multiLine
              hintText="This is what your texters will send to your contacts. E.g. Hi, {firstName}. It's {texterFirstName} here."
            />
            <Form.Field
              name='questionText'
              label='Question'
              fullWidth
              disabled={interactionStep.externalQuestionId}
              hintText='A question for texters to answer. E.g. Can this person attend the event?'
            />
            {
              this.props.availableActions.some(({ name }) => name === 'osdi-survey-question') &&
              <div>
                You may also map a question from your connected OSDI system.
                <CampaignOSDIQuestionFetcher organizationId={this.props.organizationId} mapQuestion={responses => this.mapOSDIQuestion(interactionStep.id, responses)} />
              </div>
            }
          </GSForm>
        </CardText>
      </Card>
      <div style={styles.answerContainer}>
        {interactionStep.questionText && interactionStep.script && (!interactionStep.parentInteractionId || interactionStep.answerOption) ? <div>
          <RaisedButton
            label='+ Add a response'
            onTouchTap={this.addStep.bind(this, interactionStep.id)}
            style={{ marginBottom: '10px' }}
          />
        </div> : ''}
        {interactionStep.interactionSteps.filter((is) => !is.isDeleted).map((is) => {
          return (
            <div>
              {this.renderInteractionStep(is, `Question: ${interactionStep.questionText}`)}
            </div>
          )
        })}
      </div>

    </div>)
  }

  render() {
    const tree = makeTree(this.state.interactionSteps)

    return (
      <div>
        <CampaignFormSectionHeading
          title='What do you want to discuss?'
          subtitle='You can add scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity.'
        />
        {this.renderInteractionStep(tree)}
        <RaisedButton
          primary
          label={this.props.saveLabel}
          onTouchTap={this.onSave.bind(this)}
        />
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
  errors: type.array,
  availableActions: type.array,
  organizationId: type.string.isRequired
}
