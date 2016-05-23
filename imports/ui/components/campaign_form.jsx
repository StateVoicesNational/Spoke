import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { insert } from '../../api/campaigns/methods'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import {Tabs, Tab} from 'material-ui/Tabs'
import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
import RaisedButton from 'material-ui/RaisedButton';

const ScriptCollection = new Mongo.Collection(null)

const styles = {
  stepperNavigation: {
    marginTop: 48
  }
}
export class CampaignForm extends Component {
  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onScriptChange = this.onScriptChange.bind(this)
    this.handleAddScriptRow = this.handleAddScriptRow.bind(this)
    this.onContactsUpload = this.onContactsUpload.bind(this)
    this.onTexterAssignment = this.onTexterAssignment.bind(this)
    this.onTitleChange = this.onTitleChange.bind(this)
    this.onDescriptionChange = this.onDescriptionChange.bind(this)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrev = this.handlePrev.bind(this)


    this.state = {
      stepsFinished: false,
      stepIndex: 0,
      nextStepEnabled: false,
      uploading: false,
      contacts: [],
      customFields: [],
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


  handleNext() {
    const {stepIndex} = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
      // not dynamic
      stepsFinished: stepIndex >= 3,
    });
  };

  handlePrev() {
    const {stepIndex} = this.state;
    if (stepIndex > 0) {
      this.setState({stepIndex: stepIndex - 1});
    }
  }

  onTitleChange(event) {
    this.setState({title: event.target.value})
  }

  onDescriptionChange(event) {
    this.setState({description: event.target.value})
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

  enableNext() {
    this.setState({
      nextStepEnabled: true
    })
  }

  disableNext() {
    this.setState({
      nextStepEnabled: false
    })
  }
  onContactsUpload(contacts, customFields) {
    console.log("contacts upload!")
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

  renderNavigation() {
    const { stepIndex, nextStepEnabled } = this.state

    return (
      <div style={styles.stepperNavigation}>
        <FlatButton
          label="Back"
          disabled={stepIndex === 0}
          onTouchTap={this.handlePrev}
        />
        <RaisedButton
          primary
          label={stepIndex === 2 ? 'Finish' : 'Next'}
          disabled={!nextStepEnabled}
          onTouchTap={this.handleNext}
        />
      </div>
    )
  }

  renderPeopleSection() {
    const { assignedTexters, contacts, title, description } = this.state
    const { texters } = this.props

    return (
      <div>
        <CampaignPeopleForm
          texters={texters}
          contacts={contacts}
          title={title}
          description={description}
          onDescriptionChange={this.onDescriptionChange}
          onTitleChange={this.onTitleChange}
          assignedTexters={assignedTexters}
          onTexterAssignment={this.onTexterAssignment}
          onContactsUpload={this.onContactsUpload}
          onValid={this.enableNext.bind(this)}
          onInvalid={this.disableNext.bind(this)}
        />
      </div>
    )
  }

  renderScriptSection() {
    const { contacts, customFields, script, faqScripts } = this.state

    return (
      <CampaignScriptsForm
        script={script}
        faqScripts={faqScripts}
        onScriptChange={this.onScriptChange}
        customFields={customFields}
        sampleContact={contacts[0]}
      />
    )
  }

  render() {
    const { stepIndex, stepsFinished} = this.state

    const steps = [
      ['People', this.renderPeopleSection()],
      ['Scripts', this.renderScriptSection()],
      ['Surveys', <div>Surveys</div>],
      ['Review & submit', this.renderSummarySection()]
    ]

    return (
      <div>
        <Stepper activeStep={stepIndex}>
          { steps.map(([stepTitle, ...rest]) => (
            <Step>
              <StepLabel>{stepTitle}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {stepsFinished ? (
            <p>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  this.setState({stepIndex: 0, stepsFinished: false});
                }}
              >
                Click here
              </a> to reset the example.
            </p>
          ) : (
            <div>
              {steps[stepIndex][1]}
              {this.renderNavigation()}
            </div>
          )}
        </div>
      </div>
    )
  }
}
