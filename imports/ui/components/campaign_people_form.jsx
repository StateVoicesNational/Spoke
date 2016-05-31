import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import Avatar from 'material-ui/Avatar'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import Formsy from 'formsy-react'
import { FormsyText } from 'formsy-material-ui/lib'
import { Chip } from './chip'
import Subheader from 'material-ui/Subheader'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
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
    this.handleNewRequest = this.handleNewRequest.bind(this)
  }

  notifyFormError(data) {
    console.error('Form error:', data);
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

  handleNewRequest(value) {
    // If you're searching but get no match, value is a string
    // representing your search term, but we only want to handle matches
    if (typeof(value) === 'object') {
      const texterId = value.value.key
      // TODO react addon for modifying immutable state
      let newAssignedTexters
      if (texterId === 'allTexters') {
        const { texters } = this.props
        newAssignedTexters = texters.map((texter) => texter._id)
      } else {
        const { assignedTexters } = this.props
        newAssignedTexters = assignedTexters.concat([texterId])
      }

      const { onTexterAssignment } = this.props
      onTexterAssignment(newAssignedTexters)
    }
  }

  dataSourceItem(name, key, image) {
    return {
      text: name,
      value: (
        <ListItem
          key={key}
          primaryText={name}
          avatar={<Avatar src={image} />}
        />
      )
    }
  }
  renderAssignmentSection() {
    const { texters, assignedTexters } = this.props
    // TODO remove already assigned texters
    const dataSource = [this.dataSourceItem('Assign all texters', 'allTexters', null)].concat(
      texters.filter((texter) =>
        assignedTexters.indexOf(texter._id) === -1).map((texter) =>
          this.dataSourceItem(
          `${texter.firstName} ${texter.lastName}`,
          texter._id,
          'images/chexee-128.jpg'
        )
      )
    )
    // TODO helper function for the names

    const filter = (searchText, key) => (key === 'allTexters') ? true : AutoComplete.caseInsensitiveFilter(searchText, key)

    // TODO https://github.com/callemall/material-ui/pull/4193/commits/8e80a35e8d2cdb410c3727333e8518cadc08783b
    const autocomplete = (
      <AutoComplete
        openOnFocus
        filter={filter}
        hintText="Search for texters to assign"
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
      />
    )
    return (<div>
     {autocomplete}
     { assignedTexters.map((texterId) => {
        const user = Meteor.users.findOne({_id: texterId})
        return (
            <Chip
              text={user.firstName}
            />
        )
     }) }
    </div>)
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
          ref="contacts"
          name="contacts"
          value={this.getUploadInputValue(contacts)}
        />
        { this.renderImportValidation()}
      </div>
    )
  }

  renderImportValidation() {
    const { contacts, customFields, validationStats } = this.props
    return (
      <Card>
        <CardText>
          <div>
            {validationStats ? this.renderValidationStats() : ''}
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
        <Subheader>Upload summary</Subheader>

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
      onDescriptionChange
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
            required
            onChange={onTitleChange}
            ref="title"
            name='title'
            value={title}
            floatingLabelText="Campaign title"
          />
          <FormsyText
            name='description'
            fullWidth
            value={description}
            onChange={onDescriptionChange}
            required
            ref="description"
            floatingLabelText="Campaign description"
          />
          <input style={styles.hiddenInput} ref="hiddenInput" />
          { this.renderUploadSection() }
          { this.renderAssignmentSection() }
        </Formsy.Form>
      </div>
    )
  }

}
