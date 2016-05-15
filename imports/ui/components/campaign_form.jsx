import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import Badge from 'material-ui/Badge';
import { FlowRouter } from 'meteor/kadira:flow-router'
import Divider from 'material-ui/Divider';

import { insert } from '../../api/campaigns/methods'
import { findScriptVariable } from '../helpers/script_helpers'
import { ScriptEditor } from './script_editor'
import { parseCSV } from '../../api/campaign_contacts/parse_csv'
import AutoComplete from 'material-ui/AutoComplete';


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
  scriptSection: {
    marginTop: 24
  }
}

ScriptCollection = new Mongo.Collection(null)
export class CampaignForm extends Component {
  constructor(props) {
    super(props)
    this.handleUpload = this.handleUpload.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleOpenScriptDialog = this.handleOpenScriptDialog.bind(this)
    this.handleCloseScriptDialog = this.handleCloseScriptDialog.bind(this)
    this.handleAddScriptRow = this.handleAddScriptRow.bind(this)
    this.onScriptChange = this.onScriptChange.bind(this)

    this.state = {
      uploading: false,
      contacts: [],
      customFields: [],
      scriptDialogOpen: false,
      script: null,
      faqScripts: []
    }

  }

  componentWillMount() {
    Tracker.autorun(() => {
      const faqScripts = ScriptCollection.find({ isFaqReply: true }).fetch()
      const script = ScriptCollection.findOne({ initial: true })
      this.setState({ faqScripts, script })
    })

    ScriptCollection.insert({
      script: 'This is the initial message we send to the users',
      isFaqReply: false,
      initial: true
    })
  }


  handleSubmit() {
    const { contacts, script, faqScripts } = this.state
    const title = this.refs.title.getValue().trim()
    const description = this.refs.title.getValue().trim()

    const data = {
      title,
      description,
      contacts,
      faqScripts,
      script: script.script,
    }

    insert.call(data, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("submitted!")
        FlowRouter.go('/campaigns')
        // this.resetState()
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

  handleOpenScriptDialog() {
    this.setState({ scriptDialogOpen: true })
  }
  handleCloseScriptDialog() {
    this.setState({ scriptDialogOpen: false })
  }

  onScriptChange(script) {
    console.log("onscript change", script)
    // this.setState({ script })
  }

  handleAddScriptRow() {
    const script = {
      script: 'Hello {firstName}',
      title: 'Label here',
      isFaqReply: true
    }

    ScriptCollection.insert(script)

    // const { faqScripts } = this.state
    // faqScripts.push({
    //   script: '',
    //   title: ''
    // })
    // this.setState({faqScripts})

  }

  renderScriptDialogOptions() {
    return [
    ]
  }

  renderDialogActions() {
    return [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleCloseDialog}
        primary
      />,
    ]
  }

  handleUpdateInput (value) {
    console.log("update autocomplete value", value)
  }
  renderAssignmentSection() {
    const dataSource = [
      {'value': 1, 'text': 'Sheena Pakanati'},
      {'value': 2, 'text': 'Saikat Chakrabarti'},
      {'value': 3, 'text': 'Supratik Lahiri'}
    ]

    // TODO https://github.com/callemall/material-ui/pull/4193/commits/8e80a35e8d2cdb410c3727333e8518cadc08783b
    const autocomplete =       <AutoComplete
        filter={AutoComplete.caseInsensitiveFilter}
        hintText="Search for a name"
        dataSource={dataSource}
        onUpdateInput={this.handleUpdateInput}
      />

    // const dataSource = [
    //   'Sheena',
    //   'Saikat',
    //   'Rossy',
    //   'Supratik'
    // ]
    return <div>
      <Divider />
      <h2>Assignments</h2>
     {autocomplete}
    </div>
  }

  renderScriptSection() {
    const hideScriptSection = this.state.contacts.length === 0
    const { faqScripts, script } = this.state
    return hideScriptSection ? '' : (
      <div>
        <Divider />
          <h2>Scripts</h2>
                {this.renderScriptRow(script)}
                { faqScripts.map((faqScript) => this.renderScriptRow(faqScript))}
        <FlatButton
          label="Add another script"
          onTouchTap={this.handleAddScriptRow}
          secondary
        />
      </div>
    )
  }

  renderUploadSection() {
    const { contacts } = this.state
    const contactsUploaded = contacts.length > 0
    return (
      <div>
        <RaisedButton
          style={styles.button}
          label= "Upload contacts"
          labelPosition="before"
        >
          <input type="file" style={styles.exampleImageInput} onChange={this.handleUpload}/>
        </RaisedButton>

        {contactsUploaded ? (<span>{`${contacts.length} contacts uploaded`}</span>) : ''}
      </div>
    )
  }

  formValid() {
    return this.state.contacts.length > 0 && this.state.script !== ''
  }

  renderSaveButton() {
    return !this.formValid() ? '' : <FlatButton
      label="Save"
      onTouchTap={this.handleSubmit}
      primary
    />
  }

  renderScriptRow(script) {
    console.log("script, script", script)
    return (!script ? '' :
          <ScriptEditor
            key={script._id}
            title={script.title}
            script={script.script}
            titleEditable={!script.initial}
            expandable={true}
            sampleContact={this.state.contacts[0]}
            customFields={this.state.customFields}
            onScriptChange={this.onScriptChange}
          />
    )
  }
  render() {
    const { contacts } = this.state
    const { open, onRequestClose } = this.props

    return (
      <div>
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
        {this.renderUploadSection()}
        {this.renderScriptSection()}
        {this.renderAssignmentSection()}
        {this.renderSaveButton()}
      </div>

    )
  }
}
