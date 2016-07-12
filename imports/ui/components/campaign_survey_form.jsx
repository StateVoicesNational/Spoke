import React,  { Component } from 'react'
import ReactDOM from 'react-dom'
import RaisedButton from 'material-ui/RaisedButton'
import { CampaignQuestionForm } from './campaign_question_form'
import { CampaignFormSectionHeading } from './campaign_form_section_heading'

const styles = {
  questionButton: {
    marginTop: 24
  }
}

export class CampaignSurveyForm extends Component {
  constructor(props) {
    super(props)
    this.handleClickStepLink = this.handleClickStepLink.bind(this)
    this.handleAddQuestion = this.handleAddQuestion.bind(this)
  }
  handleClickStepLink(interactionStepId) {
    this.scrollToStep(interactionStepId)
  }

  scrollToStep(interactionStepId) {
    const node = ReactDOM.findDOMNode(this.refs[interactionStepId])
    node.scrollIntoView()
  }

  handleAddQuestion(step) {
    const {  onAddQuestion } = this.props
    onAddQuestion(step)
    this.scrollStepId = step.newStepId
  }

  componentDidUpdate() {
    if (this.scrollStepId) {
      this.scrollToStep(this.scrollStepId)
      this.scrollStepId = null
    }
  }
  render() {
    const { interactionSteps, onValid, onInvalid, onAddSurveyAnswer, onDeleteQuestion, onEditQuestion,  customFields, sampleContact, campaign} = this.props

    const campaignStarted = campaign && campaign.hasMessage()

    let subtitle
    if (campaignStarted) {
      subtitle = "Once messages have been sent to contacts in this campaign, you can't edit the questions or answers, but you can still edit scripts if you need."
    }
    else {
      subtitle = 'You can add  scripts and questions and your texters can indicate responses from your contacts. For example, you might want to collect RSVPs to an event or find out whether to follow up about a different volunteer activity.'
    }

    return (
      <Formsy.Form
        onValid={onValid}
        onInvalid={onInvalid}
      >
        <CampaignFormSectionHeading
          title='What do you want to discuss?'
          subtitle={subtitle}
        />

        { _.map(interactionSteps, (interactionStep, index) => (
          <CampaignQuestionForm
            ref={interactionStep._id}
            interactionStep={interactionStep}
            questions={interactionSteps}
            onAddSurveyAnswer={onAddSurveyAnswer}
            onEditQuestion={onEditQuestion}
            onDeleteQuestion={onDeleteQuestion}
            onClickStepLink={this.handleClickStepLink}
            onAddQuestion={this.handleAddQuestion}
            customFields={customFields}
            sampleContact={sampleContact}
            campaignStarted={campaignStarted}
          />
        ))}
        {
          interactionSteps.length === 0 ? (
            <RaisedButton
              style={styles.questionButton}
              label="Add question"
              onTouchTap={onAddQuestion}
            />
          ) : ''
        }
      </Formsy.Form>
    )
  }
}
