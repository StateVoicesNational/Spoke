import React, { Component } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import {
  insert,
  updateBasics,
  updateContacts,
  updateTexters,
  updateSurveys,
  updateScripts
} from '../../api/campaigns/methods'
import { ScriptTypes } from '../../api/campaigns/scripts'
import { Assignments } from '../../api/assignments/assignments'
import { Messages } from '../../api/messages/messages'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import { CampaignNewForm } from './campaign_new_form'
import { CampaignEditForm } from './campaign_edit_form'
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import { CampaignBasicsForm } from './campaign_basics_form'
import { CampaignSurveyForm } from './campaign_survey_form'
import { CampaignAssignmentForm } from './campaign_assignment_form'
import { CampaignFormSection } from './campaign_form_section'
import { grey50 } from 'material-ui/styles/colors'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import { newAllowedAnswer } from '../../api/survey_questions/survey_questions'
import { Tabs, Tab } from 'material-ui/Tabs'
import RaisedButton from 'material-ui/RaisedButton'
import { Random } from 'meteor/random'

import {
  Step,
  Stepper,
  StepLabel
} from 'material-ui/Stepper'


export const SectionTitles = {
  basics: 'Basics',
  contacts: 'Contacts',
  texters: 'Texters',
  scripts: 'Scripts',
  surveys: 'Surveys'
}

const ScriptCollection = new Mongo.Collection(null)
const QuestionCollection = new Mongo.Collection(null)

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
    this.handleSubmitSurveys = this.handleSubmitSurveys.bind()

    this.handleScriptChange = this.handleScriptChange.bind(this)
    this.handleScriptDelete = this.handleScriptDelete.bind(this)
    this.handleScriptAdd = this.handleScriptAdd.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.resetState()
  }

  resetState() {
    const { campaign, texters } = this.props

    const assignedTexters = campaign ? Assignments.find({ campaignId: campaign._id }).fetch().map(({ userId }) => userId) : texters.map((texter) => texter._id)
    this.state = {
      stepIndex: 0,
      title: campaign ? campaign.title : '',
      description: campaign ? campaign.description : '',
      dueBy: campaign ? campaign.dueBy : null,
      customFields: campaign ? campaign.customFields : [],
      contacts: [],
      assignedTexters,
      scripts: [], // FIXME
      questions: [], // FIXME
      submitting: false
    }

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
        title: SectionTitles.scripts,
        content: this.renderScriptSection.bind(this)
      },
      {
        title: SectionTitles.surveys,
        content: this.renderSurveySection.bind(this)
      }
    ]
  }

  componentWillUnmount() {
    this._computation.stop()
  }

  componentWillMount() {
    // workaround for https://github.com/meteor/react-packages/issues/99
    setTimeout(this.startComputation.bind(this), 0)

    const { campaign } = this.props
    if (campaign) {
      _.each(campaign.scripts, (script) => ScriptCollection.insert(script))
      _.each(campaign.surveys().fetch(), (survey) => QuestionCollection.insert(survey))
    }

  }

  startComputation() {
    this._computation = Tracker.autorun(() => {
      this.setState({
        scripts: ScriptCollection.find().fetch(),
        questions: QuestionCollection.find({}).fetch()
      })
    })
  }

  // UPDATE CAMPAIGN
  handleChange(newState) {
    console.log(newState)
    this.setState(newState)
    console.log(this.state)
  }

  //    SCRIPTS
  handleScriptAdd(script) {
    ScriptCollection.insert(script)
  }

  handleScriptChange(scriptId, data) {
    ScriptCollection.update(scriptId, { $set: data })
  }

  handleScriptDelete(scriptId) {
    ScriptCollection.remove(scriptId)
  }

  // QUESTIONS
  handleDeleteQuestion(questionId) {
    QuestionCollection.update({ 'allowedAnswers.surveyQuestionId': questionId }, { $set: { 'allowedAnswers.$.surveyQuestionId': null } }, { multi: true })
    QuestionCollection.remove(questionId)
  }

  handleEditSurvey(questionId, data) {
    QuestionCollection.update(questionId, { $set: data })
  }

  handleAddSurveyAnswer(questionId) {
    const question = QuestionCollection.findOne({ _id: questionId })

    QuestionCollection.update(questionId, {
      $set: {
        allowedAnswers: question.allowedAnswers.concat([newAllowedAnswer('Answer')])
      }
    })
  }

  handleAddSurvey() {
    const question = {
      text: 'Question',
      allowedAnswers: [newAllowedAnswer('Option 1')],
      isTopLevel: true
    }
    QuestionCollection.insert(question)
  }

  getCampaignModel() {
    const {
      title,
      description,
      contacts,
      scripts,
      assignedTexters,
      questions,
      customFields,
      dueBy
    } = this.state

    const { organizationId } = this.props

    return {
      title,
      description,
      contacts,
      organizationId,
      assignedTexters,
      customFields,
      dueBy,
      // FIXME This omit is really awkward. Decide if I should be using subdocument _ids instead.
      scripts: _.map(scripts, (script) => _.omit(script, ['_id'])),
      // FIXME
      surveys: questions
    }
  }

  // SUBMIT TO SERVER
  handleSubmitBasics() {
    const { title, description, dueBy } = this.state
    console.log('title, description, basics', title)

    const { campaign, organizationId } = this.props
    const data = {
      title,
      description,
      dueBy,
      organizationId,
      campaignId: campaign._id
    }

    updateBasics.call(data, (err) => console.log('error', err))
  }

  handleSubmitScripts() {
    const { scripts } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      scripts,
      organizationId,
      campaignId: campaign._id
    }
    updateScripts.call(data, (err) => alert(err))
  }

  handleSubmitTexters() {
    const { assignedTexters } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      assignedTexters,
      organizationId,
      campaignId: campaign._id
    }
    updateTexters.call(data, (err) => alert(err))

    console.log('campaign assigned texter submit')
  }

  handleSubmitSurveys() {
    const { surveys } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      surveys,
      organizationId,
      campaignId: campaign._id
    }
    updateSurveys.call(data, (err) => alert(err))

    console.log('campaign survey submit')
  }

  handleSubmitContacts() {
    const { contacts } = this.state
    const { campaign, organizationId } = this.props
    const data = {
      contacts,
      organizationId,
      campaignId: campaign._id
    }
    updateContacts.call(data, (err) => alert(err))

    console.log('campaign contact submit')
  }

  handleCreateNewCampaign() {
    const { campaign, organizationId } = this.props
    this.setState({ submitting: true })

    const data = this.getCampaignModel()

    insert.call(data, (err) => {
      this.setState({ submitting: false })

      if (err) {
        alert(err)
      } else {
        ScriptCollection.remove({})
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

    return (
      <CampaignPeopleForm
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
    const faqScripts = scripts.filter((script) => script.type === ScriptTypes.FAQ)
    const defaultScript = scripts.find((script) => script.type === ScriptTypes.INITIAL)

    return (
      <CampaignScriptsForm
        script={defaultScript}
        faqScripts={faqScripts}
        onScriptChange={this.handleScriptChange}
        onScriptDelete={this.handleScriptDelete}
        onAddScript={this.handleScriptAdd}
        customFields={customFields}
        sampleContact={contacts[0]}
      />
    )
  }

  renderSurveySection() {
    const { questions, customFields, sampleContact } = this.state
    return (
      <CampaignSurveyForm
        questions={questions}
        onAddSurveyAnswer={this.handleAddSurveyAnswer}
        onEditQuestion={this.handleEditSurvey}
        onAddQuestion={this.handleAddSurvey}
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
        onSubmitSurveys={this.handleSubmitSurveys}
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
