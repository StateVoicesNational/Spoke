import React, { Component } from 'react'
import { FlowRouter } from 'meteor/kadira:flow-router'
import {
  insert,
  updateBasics,
  updateContacts,
  updateTexters,
  updateQuestions,
  updateScripts
} from '../../api/campaigns/methods'
import { ScriptTypes } from '../../api/scripts/scripts'
import { Assignments } from '../../api/assignments/assignments'
import { CampaignNewForm } from './campaign_new_form'
import { CampaignEditForm } from './campaign_edit_form'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import { CampaignBasicsForm } from './campaign_basics_form'
import { CampaignSurveyForm } from './campaign_survey_form'
import { CampaignAssignmentForm } from './campaign_assignment_form'
import { newAllowedAnswer } from '../../api/interaction_steps/interaction_steps'
import { InteractionStepCollection } from '../local_collections/interaction_steps'

import {
  Step,
  Stepper,
  StepLabel
} from 'material-ui/Stepper'

const handleError = (error) => {
  if (error) {
    console.log(error)
    alert(error)
  }
}
export const SectionTitles = {
  basics: 'Basics',
  contacts: 'Contacts',
  texters: 'Texters',
  scripts: 'Scripts',
  surveys: 'Surveys'
}

const ScriptCollection = new Mongo.Collection(null)

const styles = {
  cardActions: {
    padding: 16
  }
}

export class CampaignForm extends Component {
  constructor(props) {
    super(props)

    this.handleCreateNewCampaign = this.handleCreateNewCampaign.bind(this)
    this.handleSubmitBasics = this.handleSubmitBasics.bind(this)
    this.handleSubmitContacts = this.handleSubmitContacts.bind(this)
    this.handleSubmitTexters = this.handleSubmitTexters.bind(this)
    this.handleSubmitScripts = this.handleSubmitScripts.bind(this)
    this.handleSubmitInteractionSteps = this.handleSubmitInteractionSteps.bind(this)

    this.handleScriptChange = this.handleScriptChange.bind(this)
    this.handleScriptDelete = this.handleScriptDelete.bind(this)
    this.handleScriptAdd = this.handleScriptAdd.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.resetState()

    this.sections = [
      {
        title: SectionTitles.basics,
        content: this.renderBasicsSection.bind(this)
      },
      {
        title: SectionTitles.contacts,
        content: this.renderPeopleSection.bind(this)
      },
      {
        title: SectionTitles.texters,
        content: this.renderAssignmentSection.bind(this)
      },
      {
        title: SectionTitles.surveys,
        content: this.renderSurveySection.bind(this)
      },
      {
        title: SectionTitles.scripts,
        content: this.renderScriptSection.bind(this)
      }
    ]
  }

  resetState() {
    const { campaign, texters, assignedTexters, scripts, interactionSteps } = this.props

    this.state = {
      stepIndex: 0,
      title: campaign ? campaign.title : '',
      description: campaign ? campaign.description : '',
      dueBy: campaign ? campaign.dueBy : null,
      customFields: campaign ? campaign.customFields : [],
      contacts: [],
      assignedTexters: assignedTexters || [],
      scripts: scripts || [],
      interactionSteps: interactionSteps || [],
      submitting: false,
    }

    ScriptCollection.remove({})
    InteractionStepCollection.remove({})
    console.log("campaign", campaign)
    if (campaign) {
      _.each(scripts, (script) => ScriptCollection.insert(script))
      _.each(interactionSteps, (step) => InteractionStepCollection.insert(step))
    } else {
      console.log("got here!?")
      const step = {
        allowedAnswers: [newAllowedAnswer('')],
        isTopLevel: true
      }
      InteractionStepCollection.insert(step)
    }
  }

  componentWillMount() {
    // workaround for https://github.com/meteor/react-packages/issues/99
    setTimeout(this.startComputation.bind(this), 0)
  }

  componentDidUpdate(prevProps) {
    console.log("prev props", this.props, prevProps)
    if (prevProps !== this.props) {
      const { campaign, scripts, interactionSteps } = this.props
      this.resetState()
    }

  }

  componentWillUnmount() {
    this._computation.stop()
  }

  startComputation() {
    this._computation = Tracker.autorun(() => {
      this.setState({
        scripts: ScriptCollection.find({}).fetch(),
        interactionSteps: InteractionStepCollection.find({}).fetch()
      })

      console.log(ScriptCollection.find({}).fetch())
      console.log(this.state.scripts)
    })
  }

  // UPDATE CAMPAIGN
  handleChange(newState) {
    console.log(newState)
    this.setState(newState)
    console.log(this.state)
  }

  //    SCRIPTS
  handleScriptAdd(script, callback) {
    ScriptCollection.insert(script)
    console.log("added a script")
    console.log(ScriptCollection.find({}).fetch())
    callback()
  }

  handleScriptChange(scriptId, data, callback) {
    console.log("edit script?", scriptId, data)
    ScriptCollection.update(scriptId, { $set: data })
    callback()
  }

  handleScriptDelete(scriptId) {
    console.log("scriptID")
    ScriptCollection.remove(scriptId)
  }

  // QUESTIONS
  handleDeleteQuestion(questionId) {
    InteractionStepCollection.update({ 'allowedAnswers.interactionStepId': questionId }, { $set: { 'allowedAnswers.$.interactionStepId': null } }, { multi: true })
    InteractionStepCollection.remove(questionId)
  }

  handleEditSurvey(questionId, data) {
    InteractionStepCollection.update(questionId, { $set: data })
  }

  handleAddInteractionStepAnswer(questionId) {
    const question = InteractionStepCollection.findOne({ _id: questionId })

    InteractionStepCollection.update(questionId, {
      $set: {
        allowedAnswers: question.allowedAnswers.concat([newAllowedAnswer('Answer')])
      }
    })
  }

  handleAddInteractionStep({ parentStepId, parentAnswerId }) {
    console.log("adding interaction step?")
    const step = {
      allowedAnswers: [newAllowedAnswer('')],
      isTopLevel: false
    }
    const newStepId = InteractionStepCollection.insert(step)
    // console.log("all steps", InteractionStepCollection.find({}).fetch())
    InteractionStepCollection.update({
      _id: parentStepId,
      "allowedAnswers._id": parentAnswerId
    }, {
      $set: {
        "allowedAnswers.$.interactionStepId": newStepId
      }
    })
  }

  getCampaignModel() {
    const {
      title,
      description,
      contacts,
      scripts,
      assignedTexters,
      customFields,
      dueBy,
      interactionSteps
    } = this.state

    const { organizationId } = this.props

    const newInteractionSteps =  interactionSteps.map((step) => _.extend({}, step, step.question ? {} : { allowedAnswers: [] }))

    return {
      title,
      description,
      contacts,
      organizationId,
      assignedTexters,
      customFields,
      dueBy,
      scripts,
      interactionSteps: newInteractionSteps
    }
  }

  // SUBMIT TO SERVER
  handleSubmitBasics() {
    const { title, description, dueBy } = this.state

    const { campaign, organizationId } = this.props
    const data = {
      title,
      description,
      dueBy,
      organizationId,
      campaignId: campaign._id
    }

    updateBasics.call(data, handleError)
  }

  handleSubmitScripts() {
    const { scripts } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      scripts,
      organizationId,
      campaignId: campaign._id
    }

    updateScripts.call(data, handleError)
  }

  handleSubmitTexters() {
    const { assignedTexters } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      assignedTexters,
      organizationId,
      campaignId: campaign._id
    }
    updateTexters.call(data, handleError)
  }

  handleSubmitInteractionSteps() {
    const { interactionSteps } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      organizationId,
      interactionSteps,
      campaignId: campaign._id
    }

    console.log("HANDLE SUBMIT INTERACTION STESP")
    updateQuestions.call(data, handleError)
  }

  handleSubmitContacts() {
    const { contacts } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      contacts,
      organizationId,
      campaignId: campaign._id
    }
    updateContacts.call(data, handleError)
  }

  handleCreateNewCampaign() {
    const { campaign, organizationId } = this.props
    this.setState({ submitting: true })

    const data = this.getCampaignModel()

    insert.call(data, (err) => {
      this.setState({ submitting: false })

      if (err) {
        console.log("error createing campaign")
        alert(err)
      } else {
        this.resetState()
        FlowRouter.go('campaigns', { organizationId })
      }
    })
  }

  renderBasicsSection() {
    const { title, description, dueBy, stepIndex } = this.state
    return (
      <CampaignBasicsForm
        title={title}
        description={description}
        dueBy={dueBy}
        onChange={this.handleChange}
      />
    )
  }

  renderPeopleSection() {
    const { contacts, customFields } = this.state
    const { campaign } = this.props
    return (
      <CampaignPeopleForm
        campaign={campaign}
        contacts={contacts}
        customFields={customFields}
        onChange={this.handleChange}
      />
    )
  }

  renderAssignmentSection() {
    const { assignedTexters } = this.state
    const { texters } = this.props

    return (
      <CampaignAssignmentForm
        texters={texters}
        assignedTexters={assignedTexters}
        onChange={this.handleChange}
      />
    )
  }

  renderScriptSection() {
    const { contacts, scripts, customFields } = this.state
    console.log("SCRIPTS", scripts)
    return (
      <CampaignScriptsForm
        scripts={scripts}
        onScriptChange={this.handleScriptChange}
        onScriptDelete={this.handleScriptDelete}
        onScriptAdd={this.handleScriptAdd}
        customFields={customFields}
        sampleContact={contacts[0]}
      />
    )
  }

  renderSurveySection() {
    const { interactionSteps, customFields, sampleContact } = this.state
    console.log("INTERACTION STEPS!?", interactionSteps)
    const { campaign } = this.props
    return (
      <CampaignSurveyForm
        interactionSteps={interactionSteps}
        campaign={campaign}
        onAddSurveyAnswer={this.handleAddInteractionStepAnswer}
        onEditQuestion={this.handleEditSurvey}
        onAddQuestion={this.handleAddInteractionStep}
        onDeleteQuestion={this.handleDeleteQuestion}
        sampleContact={sampleContact}
        customFields={customFields}
      />
    )
  }

  render() {
    const { campaign } = this.props
    const { submitting } = this.state
    return submitting ? (
      <div>
        Saving your campaign...
      </div>
    ) : (campaign ?
      <CampaignEditForm
        sections={this.sections}
        campaign={campaign}
        onSubmitContacts={this.handleSubmitContacts}
        onSubmitSurveys={this.handleSubmitInteractionSteps}
        onSubmitScripts={this.handleSubmitScripts}
        onSubmitTexters={this.handleSubmitTexters}
        onSubmitBasics={this.handleSubmitBasics}

      /> :
      <CampaignNewForm
        onSubmit={this.handleCreateNewCampaign}
        steps={this.sections}
      />
    )
  }
}
