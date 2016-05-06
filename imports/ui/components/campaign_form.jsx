import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import { insert } from '../../api/campaigns/methods.js'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'

const styles = {
  button: {
    margin: 12
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
  }
}

export class CampaignForm extends Component {
  constructor(props) {
    super(props)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.state = {
      uploading: false,
      contacts: [],
      customFields: []
    }
  }

  handleSubmit() {
    const title = this.refs.title.getValue().trim()
    const description = this.refs.title.getValue().trim()

    const { contacts } = this.state

    const data = {
      title,
      description,
      contacts
    }

    insert.call(data, (err) => {
      if (err) {
        console.log(err)
      } else {
        this.props.handleSubmit()
      }
    })

  }

  handleUpload(event) {
    event.preventDefault()
    parseCSV(event.target.files[0], ({ contacts, customFields }) => {
      this.setState({
        contacts,
        customFields
      })

    })

  }
   formData() {
    return {
      title: this.refs.title.getValue().trim(),
      description: this.refs.description.getValue().trim()
    }
  }

  renderDialogActions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
      <FlatButton
        label="Save"
        onTouchTap={this.handleSubmit}
        primary
        keyboardFocused
      />
    ]
  }

  render() {
    const { contacts } = this.state
    const { open, handleSubmit } = this.props
    console.log("hello odongo!?")
    return (
      <Dialog
        actions={this.renderDialogActions()}
        title="Create campaign"
        modal={false}
        open={open}
        onRequestClose={handleSubmit}
      >
        <TextField
          fullWidth
          ref="title"
          floatingLabelText="Title"
        />
        <TextField
          fullWidth
          ref="description"
          floatingLabelText="Description"
        />
        <RaisedButton
          label="Upload contacts"
          labelPosition="before"
          style={styles.button}
        >
          <input type="file" style={styles.exampleImageInput} onChange={this.handleUpload}/>
        </RaisedButton>
        <div>Uploaded {contacts.length} contacts</div>
        { this.state.customFields.map((field) => <div>{field}</div>)}
      </Dialog>
    )
  }
}
