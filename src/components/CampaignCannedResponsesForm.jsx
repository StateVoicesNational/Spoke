import React from 'react'
import FlatButton from 'material-ui/FlatButton'
import Form from 'react-formal'
import GSForm from './forms/GSForm'
import GSSubmitButton from './forms/GSSubmitButton'
import { List, ListItem } from 'material-ui/List'
import Divider from 'material-ui/Divider'
import CampaignFormSectionHeading from './CampaignFormSectionHeading'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import DeleteIcon from 'material-ui/svg-icons/action/delete'
import EditIcon from 'material-ui/svg-icons/image/edit'
import IconButton from 'material-ui/IconButton'
import ScriptList from './ScriptList'
import yup from 'yup'
import CreateIcon from 'material-ui/svg-icons/content/create'
import theme from '../styles/theme'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  formContainer: {
    ...theme.layouts.greenBox,
    maxWidth: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 10,
    marginTop: 15,
    textAlign: 'left'
  },
  form: {
    backgroundColor: theme.colors.white,
    padding: 10
  },
  buttonRow: {
    marginTop: 5
  }
})

// THIS IS A COPY/PASTE FROM CANNED RESPONSE FORM BECAUSE I CANT MAKE FORM.CONTEXT WORK
class CannedResponseForm extends React.Component {
  handleSave = (formValues) =>  {
    const { onSaveCannedResponse } = this.props
    console.log('saving...', this, formValues)
    onSaveCannedResponse(formValues)
  }

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    })

    const { customFields } = this.props
    return (
      <div>
        <GSForm
          ref='form'
          schema={modelSchema}
          onSubmit={this.handleSave}
        >
          <Form.Field
            name='title'
            autoFocus
            fullWidth
            label='Title'
          />
          <Form.Field
            customFields={customFields}
            name='text'
            type='script'
            label='Script'
            multiLine
            fullWidth
          />
          <div className={css(styles.buttonRow)}>
            <Form.Button
              type="submit"
              label="Add Response"
              style={{
                display: 'inline-block'
              }}
            />
            <FlatButton
              label="Cancel"
              onTouchTap={() => this.setState({ showForm: false })}
              style={{
                marginLeft: 5,
                display: 'inline-block'
              }}
            />
          </div>
        </GSForm>
      </div>
    )
  }
}

export default class CampaignCannedResponsesForm extends React.Component {

  formSchema = yup.object({
    cannedResponses: yup.array().of(yup.object({
      title: yup.string(),
      text: yup.string()
    }))
  })

  state = {
    showForm: false
  }

  showAddForm() {
    if (this.state.showForm) {
      return (
        <div
          className={css(styles.formContainer)}
        >
          <div
            className={css(styles.form)}
        >
            <CannedResponseForm
              onSaveCannedResponse={(ele) => {
                let newVals = this.props.formValues.cannedResponses.slice(0)
                ele.id = Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')
                newVals.push(ele)
                this.props.onChange({
                  cannedResponses: newVals})
                this.setState({ showForm: false })
              }}
              customFields={this.props.customFields}
            />
          </div>
        </div>
      )
    }
    return (
      <FlatButton
        secondary
        label="Add new canned response"
        icon={ <CreateIcon />}
        onTouchTap={() => this.setState({ showForm: true })}
      />
    )
  }

  listItems(cannedResponses) {
    const listItems = cannedResponses.map((response) => (
      <ListItem
        value={response.text}
        key={response.id}
        primaryText={response.title}
        secondaryText={response.text}
        rightIconButton={(
          <IconButton
            onTouchTap={() => {
              let newVals = this.props.formValues.cannedResponses.map((responseToDelete) => {
                if (responseToDelete.id === response.id) {
                  return null
                }
                return responseToDelete
              }).filter((ele) => ele !== null)

              this.props.onChange({
                cannedResponses: newVals})
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
        secondaryTextLines={2}
      />
    ))
    return listItems
  }

  render() {
    const { formValues } = this.props
    const cannedResponses = formValues.cannedResponses
    const list = cannedResponses.length === 0 ? null : (
      <List>
        {this.listItems(cannedResponses)}
        <Divider />
      </List>
    )

    return (
      <GSForm
        schema={this.formSchema}
        value={formValues}
        onChange={this.props.onChange}
        onSubmit={this.props.onSubmit}
      >
        <CampaignFormSectionHeading
          title='Canned responses for texters'
          subtitle='Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up.'
        />
        {list}
        {this.showAddForm()}
        <Form.Button
          type='submit'
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    )
  }
}
