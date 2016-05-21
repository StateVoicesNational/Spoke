import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { insert } from '../../api/campaigns/methods'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import {Tabs, Tab} from 'material-ui/Tabs'

const ScriptCollection = new Mongo.Collection(null)

export class CampaignForm extends Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onScriptChange = this.onScriptChange.bind(this)
    this.handleAddScriptRow = this.handleAddScriptRow.bind(this)
    this.onContactsUpload = this.onContactsUpload.bind(this)
    this.onTexterAssignment = this.onTexterAssignment.bind(this)
    this.state = {
      uploading: false,
      contacts: [],
      customFields: [],
      scriptDialogOpen: false,
      script: null,
      faqScripts: [],
      assignedTexters: []
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


  onScriptChange(script) {
    // this.setState({ script })
  }

  onTexterAssignment(assignedTexters) {
    this.setState({ assignedTexters })
  }

  handleSubmit() {
    const { contacts, script, faqScripts, assignedTexters } = this.state
    const { organizationId } = this.props

    const title = this.refs.title.getValue().trim()
    const description = this.refs.title.getValue().trim()

    const data = {
      organizationId,
      title,
      description,
      contacts,
      faqScripts,
      assignedTexters,
      script: script.script,
    }

    insert.call(data, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("submitted!")
        FlowRouter.go(`/${organizationId}/campaigns`)
        // this.resetState()
      }
    })

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

  handleAddScriptRow() {
    const script = {
      script: 'Hello {firstName}',
      title: 'Label here',
      isFaqReply: true
    }

    ScriptCollection.insert(script)
  }

  handleActiveTab(tab) {
    console.log("tab activated", tab)
  }

  onContactsUpload(contacts, customFields) {
    this.setState({
      contacts,
      customFields
    })
  }
  renderSummarySection() {
    const { contacts, assignedTexters } = this.state
    return (
      <div>
        <h1>Summary</h1>
        <p>
          { this.renderSaveButton() }
        </p>
      </div>
    )
  }
  render() {
    const { contacts, assignedTexters, customFields, script, faqScripts } = this.state
    const { texters } = this.props
    return (
      <div>
        <Tabs>
          <Tab label="1 - People" >
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
              <CampaignPeopleForm
                texters={texters}
                contacts={contacts}
                assignedTexters={assignedTexters}
                onTexterAssignment={this.onTexterAssignment}
                onContactsUpload={this.onContactsUpload}
              />
            </div>
          </Tab>
          <Tab label="2 - Scripts" >
            <CampaignScriptsForm
              script={script}
              faqScripts={faqScripts}
              onScriptChange={this.onScriptChange}
              customFields={customFields}
              sampleContact={contacts[0]}
            />
          </Tab>
          <Tab
            label="3 - Assignments"
            route="/home"
            onActive={this.handleActiveTab}
          >
            { this.renderSummarySection()}
          </Tab>
        </Tabs>
      </div>

    )
  }
}
