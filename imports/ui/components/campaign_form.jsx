import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { insert } from '../../api/campaigns/methods'
import { ScriptTypes } from '../../api/campaigns/scripts'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import { CampaignBasicsForm } from './campaign_basics_form'
import { CampaignSurveyForm } from './campaign_survey_form'
import { CampaignAssignmentForm } from './campaign_assignment_form'
import { grey50 } from 'material-ui/styles/colors'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import { newAllowedAnswer } from '../../api/survey_questions/survey_questions'
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
    marginTop: 48,
  },
  stepContent: {
    marginTop: 56,
    paddingBottom: 60
  },
  stepper: {
    backgroundColor: grey50,
    padding: '25 10',
    bottom: 0,
    right: 0,
    left: 0,
    height: 56,
    position: 'fixed'
  }
}
export class CampaignForm extends Component {
  constructor(props) {
    super(props)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.onScriptChange = this.onScriptChange.bind(this)
    this.onScriptDelete = this.onScriptDelete.bind(this)
    this.handleAddScript = this.handleAddScript.bind(this)
    this.onContactsUpload = this.onContactsUpload.bind(this)
    this.onTexterAssignment = this.onTexterAssignment.bind(this)
    this.onTitleChange = this.onTitleChange.bind(this)
    this.onDescriptionChange = this.onDescriptionChange.bind(this)
    this.onDueByChange = this.onDueByChange.bind(this)
    this.handleNext = this.handleNext.bind(this)
    this.handlePrev = this.handlePrev.bind(this)
    this.setupState()
  }

  setupState() {
    const { campaign, texters } = this.props

    this.state = {
      stepIndex: 0,
      nextStepEnabled: true,
      title: campaign ? campaign.title : '',
      description: campaign ? campaign.description : '',
      dueBy: campaign ? campaign.dueBy : null,
      contacts: [],
      customFields: [],
      scripts: [],
      assignedTexters: texters.map((texter) => texter._id),
      surveys: [],
      submitting: false
    }
  }

  componentWillUnmount() {
    this._computation.stop();
  }

  startComputation() {
    this._computation = Tracker.autorun(() => {
      this.setState({
        scripts: LocalCollection.find({ collectionType: 'script' }).fetch(),
        surveys: LocalCollection.find({ collectionType: 'survey' }).fetch()
      })
    })

    const script = {
      collectionType: 'script',
      text: 'Hi, {firstName}. Here is a default script initial message',
      type: ScriptTypes.INITIAL
    }

    LocalCollection.insert(script)
  }

  componentWillMount() {
    // workaround for https://github.com/meteor/react-packages/issues/99
    setTimeout(this.startComputation.bind(this), 0);
    this.steps = [
      // ['Basics', this.renderBasicsSection.bind(this)],
      // ['Contacts', this.renderPeopleSection.bind(this)],
      ['Texters', this.renderAssignmentSection.bind(this)],
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

  onDueByChange(event, date) {
    this.setState({dueBy: date})
  }

  onDescriptionChange(event) {
    this.setState({description: event.target.value})
  }

  onScriptDelete(scriptId) {
    console.log("ON SCRIPT DELETE?", scriptId)
    LocalCollection.remove({_id: scriptId})
    console.log(LocalCollection.find().fetch())
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
      scripts,
      assignedTexters,
      surveys,
      customFields,
      dueBy
    } = this.state

    const { organizationId } = this.props

    const data = {
      title,
      description,
      contacts,
      organizationId,
      assignedTexters,
      customFields,
      dueBy,
      // FIXME This omit is really awkward. Decide if I should be using subdocument _ids instead.
      scripts: _.map(scripts, (script) => _.omit(script, ['collectionType', '_id'])),
      surveys: _.map(surveys, (survey) => _.omit(survey, ['collectionType', '_id'])),
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

  handleAddScript(script) {
    LocalCollection.insert(_.extend(script, { collectionType: 'script'}))
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

  onContactsUpload({contacts, customFields }) {
    console.log("setting state now!", )
    this.setState({
      contacts,
      customFields,
    })
  }

  renderSurveySection() {
    const { surveys, customFields, sampleContact } = this.state
    return (
      <CampaignSurveyForm
        surveys={surveys}
        onAddSurveyAnswer={this.handleAddSurveyAnswer}
        onEditSurvey={this.handleEditSurvey}
        onAddSurvey={this.handleAddSurvey}
        sampleContact={sampleContact}
        customFields={customFields}
      />
    )
  }

  handleEditSurvey(surveyId, data) {
    console.log("DATA", data, surveyId)
    LocalCollection.update({
      _id: surveyId
    }, {
      $set: data
    })
  }

  handleAddSurveyAnswer(surveyId) {
    const survey = LocalCollection.findOne({_id: surveyId})

    LocalCollection.update({
      _id: surveyId
    }, {
      $set: {
        allowedAnswers: survey.allowedAnswers.concat([newAllowedAnswer('')])
      }
    })
  }

  handleAddSurvey() {
    console.log("handle add survey")
    console.log("[newAllowedAnswer('Option 1')]", newAllowedAnswer('aosentuhaoesntuh'))
    const survey = {
      question: '',
      allowedAnswers: [newAllowedAnswer('Option 1')],
      collectionType: 'survey'
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

  renderAssignmentSection() {
    const { assignedTexters } = this.state
    const { texters } = this.props

    return (
      <CampaignAssignmentForm
        texters={texters}
        assignedTexters={assignedTexters}
        onTexterAssignment={this.onTexterAssignment}
        onValid={this.enableNext.bind(this)}
        onInvalid={this.disableNext.bind(this)}
      />
    )
  }

  renderBasicsSection() {
    const { title, description, dueBy } = this.state

    return (
      <div>
        <CampaignBasicsForm
          title={title}
          description={description}
          dueBy={dueBy}
          onDescriptionChange={this.onDescriptionChange}
          onTitleChange={this.onTitleChange}
          onDueByChange={this.onDueByChange}
          onValid={this.enableNext.bind(this)}
          onInvalid={this.disableNext.bind(this)}
        />
      </div>
    )
  }

  renderPeopleSection() {
    const { contacts, customFields } = this.state

    return (
      <div>
        <CampaignPeopleForm
          contacts={contacts}
          customFields={customFields}
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
    const { contacts, scripts, customFields} = this.state
    console.log("render script section", scripts)
    const faqScripts = scripts.filter((script) => script.type === ScriptTypes.FAQ)
    const defaultScript = scripts.find((script) => script.type === ScriptTypes.INITIAL)

    return (
      <CampaignScriptsForm
        script={defaultScript}
        faqScripts={faqScripts}
        onScriptChange={this.onScriptChange}
        onScriptDelete={this.onScriptDelete}
        handleAddScript={this.handleAddScript}
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
        <div style={styles.stepContent} >
          {this.stepContent(stepIndex)}
          {this.renderNavigation()}
        </div>
        <Stepper
          style={styles.stepper}
          activeStep={stepIndex}
        >
          { this.steps.map(([stepTitle, ...rest]) => (
            <Step>
              <StepLabel>{stepTitle}</StepLabel>
            </Step>
          ))}
        </Stepper>

      </div>
    )
  }
}
