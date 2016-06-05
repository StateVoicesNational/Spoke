import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import Avatar from 'material-ui/Avatar'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import Formsy from 'formsy-react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'

import { Chip } from './chip'
import Subheader from 'material-ui/Subheader'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import { moment } from 'meteor/momentjs:moment'

const styles = {
  button: {
    margin: '24px 5px 24px 0',
    fontSize: '10px'
  },
  exampleImageInput: {
    cursor: 'pointer',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    opacity: 0
  },
  hiddenInput: {
    opacity: 0
  },
  uploadErrorListItem: {
    fontSize: '12px',
    padding: '8px 16px'
  },
  customField: {
    fontStyle: 'italic',
    margin: '10px'
  }
}

export class CampaignPeopleForm extends Component {
  constructor(props) {
    super(props)

    this.handleUpload = this.handleUpload.bind(this)
  }


  getUploadInputValue(contacts) {
    return contacts.length > 0 ? `${contacts.length} contacts uploaded` : ''
  }
  handleUpload(event) {
    event.preventDefault()
    // TODO: Handle error!
    parseCSV(event.target.files[0], ({ contacts, customFields, validationStats, error}) => {
      let newContactsValue = ''
      let contactError = null

      if (error) {
        contactError = error
      } else if (contacts.length === 0) {
        contactError = 'Upload at least one contact'
      } else if (contacts.length > 0) {
        contactError = null
        newContactsValue = this.getUploadInputValue(contacts)
      }

      // Focus first so the blur refisters
      this.refs.contacts.focus()

      this.refs.contacts.setState({
        value: newContactsValue,
      }, () => {
          // Blur just so we can actually get our form to validate
          this.refs.hiddenInput.focus()

          this.refs.form.updateInputsWithError({
            contacts: contactError
          })

          if (!contactError) {
            const { onContactsUpload } = this.props
            onContactsUpload(contacts, customFields, validationStats)
          }

      })
    })

  }

  renderUploadSection() {
    const { contacts, validationStats, customFields } = this.props
    return (
      <div>
        <RaisedButton
          style={styles.button}
          label= "Upload contacts"
          labelPosition="before"
        >
          <input type="file"
            style={styles.exampleImageInput}
            onChange={this.handleUpload}
          />
        </RaisedButton>
        <FormsyText
          required
          style={{opacity: 0}}
          ref="contacts"
          name="contacts"
          value={this.getUploadInputValue(contacts)}
        />
        {validationStats ? this.renderImportValidation() : ''}
      </div>
    )
  }

  renderImportValidation() {
    const { contacts, customFields, validationStats } = this.props
    return (
      <Card>
        <CardText>
          <div>
            {this.renderValidationStats()}
          </div>
        </CardText>
      </Card>

    )
  }

  renderValidationStats() {
    const { customFields, contacts } = this.props
    const { dupeCount, missingCellCount, invalidCellCount } = this.props.validationStats
    const stats = [
      `${dupeCount} duplicate numbers removed`,
      `${missingCellCount} missing numbers removed`,
      `${invalidCellCount} invalid numbers removed`
    ]
    return (
      <List>
        <Subheader>Summary</Subheader>

        <ListItem
          primaryText={`${contacts.length} contacts`}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          nestedItems={customFields.map((field) => (
            <ListItem
              innerDivStyle={styles.uploadErrorListItem}
              primaryText={field}
            />
          ))}
        />
        <Divider />
        <Subheader>Errors</Subheader>
        { stats.map((stat) => (
          <ListItem
            innerDivStyle={styles.uploadErrorListItem}
            primaryText={stat}
          />
        )) }
      </List>
    )
  }

  render() {
    const {
      title,
      description,
      onValid,
      onInvalid,
      onTitleChange,
      onDescriptionChange,
      onDueByChange
    } = this.props

    return (
      <div>
        <Formsy.Form
          ref="form"
          onValid={onValid}
          onInvalid={onInvalid}
          // onValidSubmit={this.submitForm.bind(this)}
          // onInvalidSubmit={this.notifyFormError.bind(this)}
        >
          <FormsyText
            fullWidth
            autoFocus
            required
            onChange={onTitleChange}
            name='title'
            value={title}
            hintText="e.g. Election Day 2016"
            floatingLabelText="Name"
          />
          <FormsyText
            name='description'
            fullWidth
            value={description}
            onChange={onDescriptionChange}
            hintText="Get out the vote"
            required
            floatingLabelText="Description"
          />
          <FormsyDate
            required
            name='dueBy'
            floatingLabelText="Due date"
            onChange={onDueByChange}
            locale="en-US"
            shouldDisableDate={(date) => moment(date).diff(moment()) < 0 }
          />
          <input style={styles.hiddenInput} ref="hiddenInput" />
          { this.renderUploadSection() }
        </Formsy.Form>
      </div>
    )
  }

}
