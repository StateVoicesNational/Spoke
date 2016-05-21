import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'
import Avatar from 'material-ui/Avatar'
import RaisedButton from 'material-ui/RaisedButton'
import Divider from 'material-ui/Divider'
import { ListItem } from 'material-ui/List'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'


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
}

export class CampaignPeopleForm extends Component {
  constructor(props) {
    super(props)

    this.handleUpload = this.handleUpload.bind(this)
    this.handleNewRequest = this.handleNewRequest.bind(this)
  }

  handleUpload(event) {
    event.preventDefault()
    // TODO: Handle error!
    parseCSV(event.target.files[0], ({ contacts, customFields }) => {
      const { onContactsUpload } = this.props
      onContactsUpload(contacts, customFields)
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
        hintText="Search for a name"
        dataSource={dataSource}
        onNewRequest={this.handleNewRequest}
        onUpdateInput={this.handleUpdateInput}
      />
    )
    return (<div>
      <Divider />
      <h2>Assignments</h2>
     {autocomplete}
     { assignedTexters.map((texterId) => <div>{ Meteor.users.findOne({_id: texterId}).firstName}</div>) }
    </div>)
  }

  renderUploadSection() {
    const { contacts } = this.props
    const contactsUploaded = contacts.length > 0
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

        {contactsUploaded ? (<span>{`${contacts.length} contacts uploaded`}</span>) : ''}
      </div>
    )
  }

  render() {
    return (
      <div>
        { this.renderUploadSection() }
        { this.renderAssignmentSection() }
      </div>
    )
  }

}
