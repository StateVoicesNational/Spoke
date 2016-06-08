import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import Formsy from 'formsy-react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'

import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import CheckIcon from 'material-ui/svg-icons/action/check-circle'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import ErrorIcon from 'material-ui/svg-icons/alert/error'
import { orange200, red400, green500, grey200 } from 'material-ui/styles/colors'

// TODO: https://github.com/callemall/material-ui/pull/4025 color property
// may be fixed on the SVGIcons eventually

const checkIcon = <CheckIcon style={{fill: green500}} />
const warningIcon = <WarningIcon style={{fill: orange200}} />
const errorIcon = <ErrorIcon style={{fill: red400}} />

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
  nestedItem: {
    fontSize: '12px',
  },
  customField: {
    fontStyle: 'italic',
    margin: '10px'
  },
  csvHeader: {
    fontFamily: 'Courier',
    backgroundColor: grey200,
    padding: 3
  }
}

export class CampaignPeopleForm extends Component {
  constructor(props) {
    super(props)


    this.handleUpload = this.handleUpload.bind(this)
    this.state = {
      uploading: false,
      validationStats: null,
      contactUploadError: null,
      contacts: null
    }
  }

  getUploadInputValue(contacts) {
    return contacts.length > 0 ? `${contacts.length} contacts uploaded` : ''
  }
  handleUpload(event) {
    event.preventDefault()
    const file = event.target.files[0]
    this.setState({uploading: true}, () => {
      // TODO: Handle error!
      const uploading = false
      parseCSV(file, ({ contacts, customFields, validationStats, error}) => {
        if (error) {
          this.handleUploadError(error)
        } else if (contacts.length === 0) {
          this.handleUploadError('Upload at least one contact')
        } else if (contacts.length > 0) {
          this.handleUploadSuccess(validationStats, contacts, customFields)
        }
      })
    })
  }

  handleUploadError(error) {
    const { onInvalid } = this.props
    this.setState({ validationStats: null, uploading: false, contactUploadError: error, contacts: null})
    onInvalid()
  }

  handleUploadSuccess(validationStats, contacts, customFields) {
    const { onContactsUpload, onValid, onInvalid } = this.props
    this.setState( { validationStats, uploading: false, contacts, contactUploadError: null })
    onContactsUpload({ contacts, customFields })
    onValid()
  }

  renderValidationStats() {
    const { customFields, contacts } = this.props
    const { dupeCount, missingCellCount, invalidCellCount } = this.state.validationStats

    let stats = [
      [dupeCount, 'duplicates'],
      [missingCellCount, 'rows with missing numbers'],
      [invalidCellCount, 'rows with invalid numbers']
    ]
    stats = stats.filter(([count, text]) => count > 0).map(([count, text]) => `${count} ${text} removed`)

    return (
      <List>
        <ListItem
          primaryText={`${contacts.length} contacts`}
          leftIcon={checkIcon}
          leftIconColor={green500}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={checkIcon}
          nestedItems={customFields.map((field) => (
            <ListItem
              innerDivStyle={styles.nestedItem}
              primaryText={field}
            />
          ))}
        />
        <Divider />
        { stats.map((stat) => (
          <ListItem
            leftIcon={warningIcon}
            innerDivStyle={styles.nestedItem}
            primaryText={stat}
          />
        )) }
      </List>
    )
  }

  render() {
    const { contacts, customFields, onValid, onInvalid } = this.props
    const { validationStats, contactUploadError } = this.state
    const { uploading } = this.state
    return (
      <div>
        <CampaignFormSectionHeading
          title='Who are you contacting?'
          subtitle={<span>
            Your upload file should be in CSV format with column headings in
            the first row. You must include <span style={styles.csvHeader}>firstName</span>,
            <span style={styles.csvHeader}>lastName</span>, and
            <span style={styles.csvHeader}>cell</span> columns. Any additional columns
            in your file will be available as custom fields to use in your texting scripts.
          </span>}
        />
        <Formsy.Form
          onValid={onValid}
          onInvalid={onInvalid}
        >

        <RaisedButton
          style={styles.button}
          label= {uploading ? 'Uploading...' : "Upload contacts"}
          labelPosition="before"
        >
          <input
            type="file"
            style={styles.exampleImageInput}
            onChange={this.handleUpload}
          />
          <FormsyText
            required
            name="contacts"
            value={this.state.contacts ? 'Contacts' : ''}
            style={styles.exampleImageInput}
          />

        </RaisedButton>
        {validationStats ? this.renderValidationStats() : ''}
        { contactUploadError ? (
          <List>
            <ListItem
              primaryText={contactUploadError}
              leftIcon={errorIcon}
            />
          </List>
        ) : ''}
        </Formsy.Form>
      </div>
    )
  }
}
