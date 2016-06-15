import React, { Component } from 'react'
import TextField from 'material-ui/TextField'
import FlatButton from 'material-ui/FlatButton'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { insert, update } from '../../api/campaigns/methods'
import { ScriptTypes } from '../../api/campaigns/scripts'
import { Assignments } from '../../api/assignments/assignments'
import { Messages } from '../../api/messages/messages'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import { CampaignScriptsForm } from './campaign_scripts_form'
import { CampaignPeopleForm } from './campaign_people_form'
import { CampaignBasicsForm } from './campaign_basics_form'
import { CampaignSurveyForm } from './campaign_survey_form'
import { CampaignAssignmentForm } from './campaign_assignment_form'
import { CampaignFormSection } from './campaign_form_section'
import { grey50 } from 'material-ui/styles/colors'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'
import { newAllowedAnswer } from '../../api/survey_questions/survey_questions'
import {Tabs, Tab} from 'material-ui/Tabs'
import RaisedButton from 'material-ui/RaisedButton'
import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';


const LocalCollection = new Mongo.Collection(null)

const styles = {
  cardActions: {
    padding: 16
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
    this.renderFormSection = this.renderFormSection.bind(this)
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
      scripts: campaign ? campaign.scripts : [],
      contacts: [],
      assignedTexters,
      questions: [],
      submitting: false
    }

    console.log("assignedTexters", assignedTexters)
  }

  componentWillUnmount() {
    this._computation.stop();
  }

  componentWillMount() {
    // workaround for https://github.com/meteor/react-packages/issues/99
    setTimeout(this.startComputation.bind(this), 0);
    this.steps = [
      ['Basics', this.renderBasicsSection.bind(this), true],
      ['Contacts', this.renderPeopleSection.bind(this), false],
      ['Texters', this.renderAssignmentSection.bind(this), true],
      ['Scripts', this.renderScriptSection.bind(this), true],
      ['Surveys', this.renderSurveySection.bind(this), false],
    ]

    const { campaign } = this.props
    if (campaign) {
      _.each(campaign.scripts, (script) => LocalCollection.insert(_.extend({}, script, {collectionType: 'script'})) )
      _.each(campaign.surveys().fetch(), (survey) => LocalCollection.insert(_.extend({}, survey, {collectionType: 'question'})))
    }

  }

  startComputation() {
    this._computation = Tracker.autorun(() => {
      this.setState({
        scripts: LocalCollection.find({ collectionType: 'script' }).fetch(),
        questions: LocalCollection.find({ collectionType: 'question' }).fetch()
      })
    })
  }

  //NAVIGATION
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
    console.log("handle previous?")
    const {stepIndex} = this.state;
    if (stepIndex > 0) {
      this.setState({stepIndex: stepIndex - 1});
    }
  }
  // END NAVIGATION

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
    LocalCollection.update({_id: scriptId}, {$set: data})
    // this.setState({ script })
  }

  onTexterAssignment(assignedTexters) {
    this.setState({ assignedTexters })
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
      scripts: _.map(scripts, (script) => _.omit(script, ['collectionType', '_id'])),
      // FIXME
      surveys: _.map(questions, (question) => _.omit(question, ['collectionType', '_id'])),
    }
  }

  handleSubmit() {
    const { campaign, organizationId } = this.props
    this.setState( { submitting: true })
    const data = _.extend({}, this.getCampaignModel(), {campaignId: campaign._id})

    if (campaign) {
      update.call(data, (err) => {
        this.setState( { submitting: false })
        if (err) {
          alert(err)
        }
      })
    } else {
      insert.call(data, (err) => {
        this.setState({ submitting: false })

        if (err) {
          console.log("ERROR", err)
          alert(err)
        } else {
          LocalCollection.remove({})
          this.resetState()
          FlowRouter.go('campaigns', { organizationId })
        }
      })
    }
  }

  handleAddScript(script) {
    console.log("trying to insert script", script)
    LocalCollection.insert(_.extend(script, { collectionType: 'script'}))
  }

  onContactsUpload({contacts, customFields }) {
    console.log("setting state now!", )
    this.setState({
      contacts,
      customFields,
    })
  }

  handleDeleteQuestion(questionId) {
    LocalCollection.remove({_id: questionId})
  }

  handleEditSurvey(questionId, data) {
    LocalCollection.update({
      _id: questionId
    }, {
      $set: data
    })
  }

  handleAddSurveyAnswer(questionId) {
    const question = LocalCollection.findOne({_id: questionId})

    LocalCollection.update({
      _id: questionId
    }, {
      $set: {
        allowedAnswers: question.allowedAnswers.concat([newAllowedAnswer('Answer')])
      }
    })
  }

  handleAddSurvey() {
    const question = {
      text: 'Question',
      allowedAnswers: [newAllowedAnswer('Option 1')],
      isTopLevel: true,
      collectionType: 'question'
    }

    LocalCollection.insert(question)
  }

  stepContent(stepIndex) {
    const content = this.steps[stepIndex][1]()
    return this.renderFormSection(content)
  }

  renderFormSection(content) {
    const { stepIndex } = this.state

    return (
      <CampaignFormSection
        previousStepEnabled={(stepIndex !== 0)}
        content={content}
        onPrevious={this.handlePrev}
        onNext={this.handleNext}
        nextStepLabel={stepIndex === this.lastStepIndex() ? 'Finish' : 'Next'}
      />
    )
  }

  renderBasicsSection() {
    const { title, description, dueBy, stepIndex } = this.state
    return (
      <CampaignBasicsForm
        title={title}
        description={description}
        dueBy={dueBy}
        onDescriptionChange={this.onDescriptionChange}
        onTitleChange={this.onTitleChange}
        onDueByChange={this.onDueByChange}
      />
    )
  }

  renderPeopleSection() {
    const { contacts, customFields } = this.state

    return (
      <CampaignPeopleForm
        contacts={contacts}
        customFields={customFields}
        onContactsUpload={this.onContactsUpload}
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
        onTexterAssignment={this.onTexterAssignment}
      />
    )
  }

  renderScriptSection() {
    const { contacts, scripts, customFields} = this.state
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

  renderNewForm(stepIndex) {
    return <div>
      <div style={styles.stepContent} >
        {this.stepContent(stepIndex)}
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
  }

  renderExistingForm() {
    const { campaign } = this.props
    const hasMessage = Messages.findOne({ campaignId: campaign._id })
    return <div style={styles.stepContent} >
    { this.steps.map(([stepTitle, stepContent, alwaysEditable]) => (
      <Card>
        <CardHeader
          title={stepTitle}
          actAsExpander={true}
          showExpandableButton={true}
        />
        <CardText expandable={true}>
          {alwaysEditable || !hasMessage ? stepContent() : "This campaign has already begun so you can't edit this section."}
        </CardText>
        {alwaysEditable || !hasMessage ? (
          <CardActions style={styles.cardActions} expandable={true}>
            <RaisedButton
              label="Save"
              primary
              onTouchTap={this.handleSubmit}
            />
          </CardActions>

        ): ""}
      </Card>
    ))}
    </div>
  }
  render() {
    const { stepIndex, submitting } = this.state
    const { campaign } = this.props
    const form = campaign ? this.renderExistingForm() : this.renderNewForm(stepIndex)
    return submitting ? (
      <div>
        Saving your campaign...
      </div>
    ) : form
  }
}
