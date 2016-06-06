import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import { ListItem, List } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import Subheader from 'material-ui/Subheader'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import CheckCircle from 'material-ui/svg-icons/action/check-circle'
import Warning from 'material-ui/svg-icons/alert/warning'
import { orange200, red400, green500 } from 'material-ui/styles/colors'

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
  }
}

export class CampaignPeopleForm extends Component {
  constructor(props) {
    super(props)

    this.handleUpload = this.handleUpload.bind(this)
    this.state = {
      uploading: false
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
      parseCSV(file, ({ contacts, customFields, validationStats, error}) => {
        let newContactsValue = ''
        let contactError = null

        if (error) {
          contactError = error
        } else if (contacts.length === 0) {
          contactError = 'Upload at least one contact'
        } else if (contacts.length > 0) {
          contactError = null
          const { onContactsUpload } = this.props
          onContactsUpload({ contacts, customFields, validationStats})
          newContactsValue = this.getUploadInputValue(contacts)
        }

        this.setState( { uploading: false })
      })
    })
  }

  renderValidationStats() {
    const { customFields, contacts } = this.props
    const { dupeCount, missingCellCount, invalidCellCount } = this.props.validationStats

    let stats = [
      [dupeCount, 'duplicates'],
      [missingCellCount, 'rows with missing numbers'],
      [invalidCellCount, 'rows with invalid numbers']
    ]
    stats = stats.filter(([count, text]) => count > 0).map(([count, text]) => `${count} ${text} removed`)

    // TODO: https://github.com/callemall/material-ui/pull/4025 color property
    // may be fixed on the SVGIcons eventually
    const check = <CheckCircle style={{fill: green500}} />
    const warning = <Warning style={{fill: orange200}} />

    return (
      <List>
        <ListItem
          primaryText={`${contacts.length} contacts`}
          leftIcon={check}
          leftIconColor={green500}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={check}
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
            leftIcon={warning}
            innerDivStyle={styles.nestedItem}
            primaryText={stat}
          />
        )) }
      </List>
    )
  }

  render() {
    const { contacts, validationStats, customFields } = this.props
    console.log("validation Stas", validationStats)
    const { uploading } = this.state
    return (
      <div>
        <CampaignFormSectionHeading
          title='Tell us who you need to contact'
          subtitle='Upload a CSV with your list of contacts and cell phone numbers.'
        />

        <RaisedButton
          style={styles.button}
          label= {uploading ? 'Uploading...' : "Upload contacts"}
          labelPosition="before"
        >
          <input type="file"
            style={styles.exampleImageInput}
            onChange={this.handleUpload}
          />
        </RaisedButton>
        {validationStats ? this.renderValidationStats() : ''}

      </div>
    )
  }
}
