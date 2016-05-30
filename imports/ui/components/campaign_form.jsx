import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { insert } from '../../api/campaigns/methods'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import { CampaignSurveyForm } from './campaign_survey_form'
import {Tabs, Tab} from 'material-ui/Tabs'

import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
import RaisedButton from 'material-ui/RaisedButton';


const LocalCollection = new Mongo.Collection(null)

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
    this.onScriptDelete = this.onScriptDelete.bind(this)
    this.handleAddScriptRow = this.handleAddScriptRow.bind(this)
    this.onContactsUpload = this.onContactsUpload.bind(this)
    this.onTexterAssignment = this.onTexterAssignment.bind(this)
    this.onTitleChange = this.onTitleChange.bind(this)
    this.onDescriptionChange = this.onDescriptionChange.bind(this)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrev = this.handlePrev.bind(this)

    this.setupState()
  }


  setupState() {
    const { campaign } = this.props

    this.state = {
      stepIndex: 0,
      nextStepEnabled: true,
      title: campaign ? campaign.title : '',
      description: campaign ? campaign.description : '',
      contacts: [],
      customFields: [],
      script: null,
      faqScripts: [],
      assignedTexters: [],
      surveys: [],
      submitting: false
    }
  }

  componentWillUnmount() {
    this._computation.stop();
  }

  startComputation() {
    this._computation = Tracker.autorun(() => {
      const scripts = LocalCollection.find({}).fetch() // reactive
      console.log("updated surveys", LocalCollection.find({ type: 'survey' }).fetch())
      if (scripts.length > 0) {
        this.setState({
          faqScripts: LocalCollection.find({ isFaqReply: true }).fetch(),
          script: LocalCollection.findOne({ initial: true }),
          surveys: LocalCollection.find({ type: 'survey' }).fetch()
        })
      }
    })

    const script = {
      type: 'script',
      script: 'Hi, {firstName}. Here is a default script initial message',
      isFaqReply: false,
      initial: true
    }

    LocalCollection.insert(script)
  }

  componentWillMount() {
    // workaround for https://github.com/meteor/react-packages/issues/99
    setTimeout(this.startComputation.bind(this), 0);
    this.steps = [
      ['People', this.renderPeopleSection.bind(this)],
      ['Scripts', this.renderScriptSection.bind(this)],
      ['Surveys', this.renderSurveySection.bind(this)],
    ]
  }


  lastStepIndex() {
    return this.steps.length - 1
  }

  handleNext() {
    const {stepIndex} = this.state
    if (stepIndex === this.lastStepIndex()) {
      this.handleSubmit()
    }
    else {
      this.setState({
        stepIndex: stepIndex + 1,
      });
    }
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

  onScriptDelete(scriptId) {
    LocalCollection.remove({_id: scriptId})
  }

  onScriptChange(scriptId, data) {
    console.log("scriptid updated sdata", scriptId, data)
    LocalCollection.update({_id: scriptId}, {$set: data})
    // this.setState({ script })
  }

  onTexterAssignment(assignedTexters) {
    this.setState({ assignedTexters })
  }

  handleSubmit() {
    const {
      title,
      description,
      contacts,
      script,
      faqScripts,
      assignedTexters,
      surveys
    } = this.state
    const { organizationId } = this.props

    const data = {
      title,
      description,
      contacts,
      organizationId,
      assignedTexters,
      faqScripts,
      surveys: _.map(surveys, (survey) => _.omit(survey, 'type')),
      script: script.script // only want the string
    }
    this.setState( { submitting: true })

    insert.call(data, (err) => {
      this.setState({ submitting: false })

      if (err) {
        alert(err)
      } else {
        FlowRouter.go('campaigns', { organizationId })
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

  handleAddScriptRow() {
    const script = {
      type: 'script',
      script: 'Hi, {firstName}. This is response to a common FAQ',
      title: 'Common issue',
      isFaqReply: true
    }

    LocalCollection.insert(script)

    console.log(LocalCollection.find({}).fetch().length, "script count")
    // const { faqScripts } = this.state
    // this.setState({
    //   faqScripts: faqScripts.concat([script])
    // })
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
  onContactsUpload(contacts, customFields, validationStats) {
    console.log("contacts upload!")
    this.setState({
      contacts,
      customFields,
      validationStats
    })
  }

  renderSurveySection() {
    return (
      <div>
      { this.state.surveys.map ((survey) => (
        <CampaignSurveyForm
          survey={survey}
          onAddSurveyAnswer={this.handleAddSurveyAnswer}
          onEditSurvey={this.handleEditSurvey}
        />
      ))}
      <FlatButton
        label="Add question"
        onTouchTap={this.handleAddSurvey}
        secondary
      />
      </div>
    )
  }

  handleEditSurvey(surveyId, data) {
    LocalCollection.update({
      _id: surveyId
    }, {
      $set: data
    })
  }

  handleAddSurveyAnswer(surveyId) {
    console.log("handle add survey answer", surveyId)
    const survey = LocalCollection.findOne({_id: surveyId})
    console.log(survey, "add survey answer", surveyId)
    LocalCollection.update({
      _id: surveyId
    }, {
      $set: {
        allowedAnswers: survey.allowedAnswers.concat([{value: ''}])
      }
    })
  }

  handleAddSurvey() {
    const survey = {
      question: '',
      allowedAnswers: [{
        value: 'Option 1' // prob want script eventually
      }],
      type: 'survey'
    }

    LocalCollection.insert(survey)
  }

  renderSummarySection() {
    const { contacts, assignedTexters } = this.state
    return (
      <div>
        <h1>Summary</h1>
        <p>
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
          label={stepIndex === this.lastStepIndex() ? 'Finish' : 'Next'}
          disabled={!nextStepEnabled}
          onTouchTap={this.handleNext}
        />
      </div>
    )
  }

  renderPeopleSection() {
    const { assignedTexters, contacts, customFields, validationStats, title, description } = this.state
    const { texters } = this.props

    return (
      <div>
        <CampaignPeopleForm
          texters={texters}
          contacts={contacts}
          customFields={customFields}
          validationStats={validationStats}
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

  stepContent(stepIndex) {
    return this.steps[stepIndex][1]()
  }

  renderScriptSection() {
    const { contacts, validationStats, script, faqScripts, customFields} = this.state
    return (
      <CampaignScriptsForm
        script={script}
        faqScripts={faqScripts}
        onScriptChange={this.onScriptChange}
        onScriptDelete={this.onScriptDelete}
        handleAddScriptRow={this.handleAddScriptRow}
        customFields={customFields}
        sampleContact={contacts[0]}
      />
    )
  }

  render() {
    const { stepIndex, submitting } = this.state

    return submitting ? (
      <div>
        Creating your campaign...
      </div>
    ) : (
      <div>
        <Stepper activeStep={stepIndex}>
          { this.steps.map(([stepTitle, ...rest]) => (
            <Step>
              <StepLabel>{stepTitle}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div>
          {this.stepContent(stepIndex)}
          {this.renderNavigation()}
        </div>
      </div>
    )
  }
}
