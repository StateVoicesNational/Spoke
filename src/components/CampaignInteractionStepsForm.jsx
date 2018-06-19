import type from 'prop-types'
import React from 'react'
import Form from 'react-formal'
import yup from 'yup'
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import DeleteIcon from '@material-ui/icons/Delete';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

import { makeTree } from '../lib'
import theme from '../styles/theme'
import GSForm from './forms/GSForm'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'

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

  addStep(parentInteractionId) {
    return () => {
      const newId = 'new' + Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')
      this.setState({
        interactionSteps: [
          ...this.state.interactionSteps,
          { id: newId, parentInteractionId, questionText: '', script: '', answerOption: '', answerActions: '', isDeleted: false }
        ]
      })
    }
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
        <CardContent>
          <GSForm
            schema={this.formSchema}
            value={interactionStep}
            onChange={this.handleFormChange.bind(this)}
          >
            {interactionStep.parentInteractionId ? <Form.Field
              name='answerOption'
              label='Answer'
              fullWidth
              hintText='Answer to the previous question'
            /> : ''}
            {interactionStep.parentInteractionId ? <DeleteIcon style={styles.pullRight} onClick={this.deleteStep(interactionStep.id).bind(this)} /> : ''}
            {interactionStep.parentInteractionId && this.props.availableActions && this.props.availableActions.length ?
              (<div key={`answeractions-${interactionStep.id}`}>
                 <Form.Field
                   name='answerActions'
                   type='select'
                   default=''
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
                    <HelpOutlineIcon />
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
              hintText='A question for texters to answer. E.g. Can this person attend the event?'
            />

          </GSForm>
        </CardContent>
      </Card>
      <div style={styles.answerContainer}>
        {interactionStep.questionText && interactionStep.script && (!interactionStep.parentInteractionId || interactionStep.answerOption) ? <div>
          <Button
            variant="contained"
            label='+ Add a response'
            onClick={this.addStep(interactionStep.id).bind(this)}
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
        <Button
          variant="raised"
          primary
          label={this.props.saveLabel}
          onClick={this.onSave.bind(this)}
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
  availableActions: type.array
}
