import React from 'react'
import { StyleSheet, css } from 'aphrodite'
import ContactToolbar from '../components/ContactToolbar'
import MessageList from '../components/MessageList'
import ProhibitedIcon from 'material-ui/svg-icons/av/not-interested'
import CannedResponseMenu from '../components/CannedResponseMenu'
import AssignmentTexterSurveys from '../components/AssignmentTexterSurveys'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import NavigateCloseIcon from 'material-ui/svg-icons/navigation/close'
import { grey100 } from 'material-ui/styles/colors'
import IconButton from 'material-ui/IconButton/IconButton'
import TextField from 'material-ui/TextField'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from 'material-ui/Toolbar'
import Dialog from 'material-ui/Dialog'
import { applyScript } from '../lib/scripts'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import yup from 'yup'
import GSForm from '../components/forms/GSForm'
import Form from 'react-formal'
import GSSubmitButton from '../components/forms/GSSubmitButton'
import SendButton from '../components/SendButton'
import CircularProgress from 'material-ui/CircularProgress';

import { getChildren, getTopMostParent, interactionStepForId } from '../lib'
import { withRouter } from 'react-router'
import wrapMutations from './hoc/wrap-mutations'

const styles = StyleSheet.create({
  container: {
    margin: 0,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  overlay: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.2,
    backgroundColor: 'black',
    color: 'white',
    zIndex: 1000000
  },
  loadingIndicator: {
    maxWidth: '50%',
  },
  navigationToolbarTitle: {
    fontSize: '12px',
    position: 'absolute',
    top: 5

  },
  topFixedSection: {
    flex: '0 0 auto'
  },
  middleScrollingSection: {
    flex: '1 1 auto',
    overflowY: 'scroll'
  },
  bottomFixedSection: {
    borderTop: `1px solid ${grey100}`,
    flex: '0 0 auto'
  },
  messageField: {
    padding: 20
  }
})

const inlineStyles = {
  exitTexterIconButton: {
    float: 'right',
    height: '56px'
  },
  toolbarIconButton: {
    position: 'absolute',
    top: 4
    // without this the toolbar icons are not centered vertically
  },
  actionToolbar: {
    backgroundColor: 'white'
  }
}

class AssignmentTexterContact extends React.Component {
  constructor(props) {
    super(props)

    const questionResponses = this.getInitialQuestionResponses(props.data.contact.interactionSteps)
    const availableSteps = this.getAvailableInteractionSteps(questionResponses)

    this.state = {
      responsePopoverOpen: false,
      messageText: this.getStartingMessageText(),
      sending: false,
      optOutDialogOpen: false,
      questionResponses,
      currentInteractionStep: availableSteps.length > 0 ? availableSteps[availableSteps.length - 1] : null
    }
  }

  getAvailableInteractionSteps(questionResponses) {
    const allInteractionSteps = this.props.data.contact.interactionSteps

    let availableSteps = []

    let step = getTopMostParent(allInteractionSteps)

    while (step) {
      availableSteps.push(step)
      const questionResponseValue = questionResponses[step.id]
      if (questionResponseValue) {
        const matchingAnswerOption = step.question.answerOptions.find((answerOption) => answerOption.value === questionResponseValue)
        if (matchingAnswerOption && matchingAnswerOption.nextInteractionStep) {
          step = interactionStepForId(matchingAnswerOption.nextInteractionStep.id, allInteractionSteps)
        } else {
          step = null
        }
      } else {
        step = null
      }
    }

    return availableSteps
  }

  getInitialQuestionResponses(interactionSteps) {
    let questionResponses = {}
    for (let interactionStep of interactionSteps) {
      if (interactionStep.question.text !== '') {
        const value = interactionStep.questionResponse ? interactionStep.questionResponse.value : null
        questionResponses[interactionStep.id] = value
      }
    }

    return questionResponses
  }
  getMessageTextFromScript(script) {
    const { data, campaign, texter } = this.props
    const { contact } = data

    return script ? applyScript({
      contact,
      texter,
      script,
      customFields: campaign.customFields
    }) : null
  }

  getStartingMessageText() {
    const { contact } = this.props.data
    const { messages } = contact
    return messages.length > 0 ? null : this.getMessageTextFromScript(contact.currentInteractionStepScript)
  }

  handleOpenPopover = (event) => {
    event.preventDefault()
    this.setState({
      responsePopoverAnchorEl: event.currentTarget,
      responsePopoverOpen: true
    })
  }

  handleClosePopover = () => {
    this.setState({
      responsePopoverOpen: false
    })
  }

  handleCannedResponseChange = (cannedResponseScript) => {
    this.handleChangeScript(cannedResponseScript)
  }

  createMessageToContact(text) {
    const { texter, assignment } = this.props
    const { contact } = this.props.data

    return {
      contactNumber: contact.cell,
      userId: texter.id,
      text,
      assignmentId: assignment.id
    }
  }

  handleClickSendMessageButton = async () => {
    await this.handleSendMessage()
    await this.handleSubmitSurveys()
    this.props.onFinishContact()
  }

  handleSendMessage = async () => {
    const { contact } = this.props.data
    this.setState({ sending: true})
    const message = this.createMessageToContact(this.refs.messageText.getValue().trim())
    await this.sendMessage(message, contact.id)
  }

  sendMessage = async(message, campaignContactId) => {
    try {
      await this.props.mutations.sendMessage(message, campaignContactId)
    } catch (e) {
      if (e.status === 402) {
        const { campaign } = this.props
        this.props.router.push(`/app/${campaign.organization.id}/todos`)
      } else {
        throw e
      }
    }
  }
  handleSubmitSurveys = async () => {
    const { contact } = this.props.data

    let deletionIds = []
    let questionResponseObjects = []

    const interactionStepIds = Object.keys(this.state.questionResponses)

    const count = interactionStepIds.length

    for (let i = 0; i < count; i++) {
      const interactionStepId = interactionStepIds[i]
      const value = this.state.questionResponses[interactionStepId]
      if (value) {
        questionResponseObjects.push({
          interactionStepId,
          campaignContactId: contact.id,
          value
        })
      } else {
        deletionIds.push(interactionStepId)
      }
    }
    const questionResponses = {

    }
    await this.props.mutations.updateQuestionResponses(questionResponseObjects, contact.id)
    await this.props.mutations.deleteQuestionResponses(deletionIds, contact.id)
  }

  handleClickCloseContactButton = async () => {
    await this.handleSubmitSurveys()
    await this.handleEditMessageStatus('closed')
    this.props.onFinishContact()
  }

  handleEditMessageStatus = async (messageStatus) => {
    const { contact } = this.props.data
    await this.props.mutations.editCampaignContactMessageStatus(messageStatus, contact.id)
  }

  handleOptOut = async ({ optOutMessageText }) => {
    const { contact } = this.props.data
    const { assignment } = this.props
    const message = this.createMessageToContact(optOutMessageText)
    await this.sendMessage(message, contact.id)

    const optOut = {
      cell: contact.cell,
      assignmentId: assignment.id
    }

    await this.props.mutations.createOptOut(optOut, contact.id)
    this.props.onFinishContact()
  }

  handleOpenDialog = () => {
    this.setState({ optOutDialogOpen: true })
  }

  handleCloseDialog = () => {
    this.setState({ optOutDialogOpen: false })
  }

  handleChangeScript = (newScript) => {
    const messageText = this.getMessageTextFromScript(newScript)

    this.setState({
      messageText
    })
  }

  handleQuestionResponseChange = ({ interactionStep, questionResponseValue, nextScript }) => {
    const { questionResponses } = this.state
    const { interactionSteps } = this.props.data.contact
    questionResponses[interactionStep.id] = questionResponseValue

    const children = getChildren(interactionStep, interactionSteps)
    for (let childStep of children) {
      if (childStep.id in questionResponses) {
        questionResponses[childStep.id] = null
      }
    }

    this.setState({
      questionResponses
    }, () => {
      this.handleChangeScript(nextScript)
    })
  }

  renderCannedResponsePopover() {
    const { campaign, assignment, texter } = this.props
    const { userCannedResponses, campaignCannedResponses } = assignment

    return (<CannedResponseMenu
      onRequestClose={this.handleClosePopover}
      open={this.state.responsePopoverOpen}
      anchorEl={this.state.responsePopoverAnchorEl}
      campaignCannedResponses={campaignCannedResponses}
      userCannedResponses={userCannedResponses}
      customFields={campaign.customFields}
      campaignId={campaign.id}
      texterId={texter.id}
      onSelectCannedResponse={this.handleCannedResponseChange}
    />)
  }
  renderOptOutDialog() {
    const { contact } = this.props.data
    const isOptedOut = contact.isOptedOut
    const actions = [
      <FlatButton
        label='Cancel'
        onTouchTap={this.handleCloseDialog}
      />,
      <Form.Button
        type='submit'
        component={GSSubmitButton}
        label='Send message and opt out user'
      />
    ]

    const schema = yup.object({
      optOutMessageText: yup.string().required()
    })

    const optOutScript = "I'm opting you out of text-based communication immediately. Have a great day."

    return (
      <div>
        <GSForm
          schema={schema}
          value={{ optOutMessageText: optOutScript }}
          onSubmit={this.handleOptOut}
        >
        <Dialog
          title='Opt out user'
          actions={actions}
          modal={false}
          open={this.state.optOutDialogOpen}
          onRequestClose={this.handleCloseDialog}
        >
            <Form.Field
              name='optOutMessageText'
              fullWidth
              multiLine
            />
        </Dialog>
        </GSForm>

      </div>
    )
  }

  renderSurveySection() {
    const { contact } = this.props.data
    const { messages } = contact

    const { questionResponses } = this.state

    const availableInteractionSteps = this.getAvailableInteractionSteps(questionResponses)

    return messages.length === 0 ? '' : (
      <div>
        <AssignmentTexterSurveys
          contact={contact}
          interactionSteps={availableInteractionSteps}
          onQuestionResponseChange={this.handleQuestionResponseChange}
          currentInteractionStep={this.state.currentInteractionStep}
          questionResponses={questionResponses}
        />
      </div>
    )
  }

  renderNeedsResponseToggleButton(contact) {
    const { messageStatus } = contact
    let button = null
    if (messageStatus === 'closed') {
      button = (<RaisedButton
        onTouchTap={() => this.handleEditMessageStatus('needsResponse')}
        label='Reopen'
      />)
    } else if (messageStatus === 'needsResponse') {
      button = (<RaisedButton
        onTouchTap={this.handleClickCloseContactButton}
        label='Close without responding'
      />)
    }

    return button
  }

  renderActionToolbar() {
    const { data, campaign, navigationToolbarChildren } = this.props

    const { contact } = data

    return (
      <Toolbar
        style={inlineStyles.actionToolbar}
      >
        <ToolbarGroup
          firstChild
        >
          <SendButton
            threeClickEnabled={campaign.organization.threeClickEnabled}
            onFinalTouchTap={this.handleClickSendMessageButton}
            disabled={this.state.sending}
          />
          {this.renderNeedsResponseToggleButton(contact)}
          <ToolbarSeparator />
          <RaisedButton
            label='Canned responses'
            onTouchTap={this.handleOpenPopover}
          />
          <ToolbarSeparator />
          <IconButton
            secondary
            style={inlineStyles.toolbarIconButton}
            label='Opt out'
            onTouchTap={this.handleOpenDialog}
            tooltip='Opt out this contact'
            tooltipPosition='top-center'
          >
            <ProhibitedIcon />
          </IconButton>
          <div
            style={{ float: 'right', marginLeft: 20 }}
          >
            {navigationToolbarChildren}
          </div>
        </ToolbarGroup>
      </Toolbar>
    )
  }

  renderTopFixedSection() {
    const { contact } = this.props.data
    return (
      <ContactToolbar
        campaignContact={contact}
        onOptOut={this.handleNavigateNext}
        rightToolbarIcon={(
          <IconButton
            onTouchTap={this.props.onExitTexter}
            style={inlineStyles.exitTexterIconButton}
            tooltip='Exit assignment'
            tooltipPosition='bottom-center'
          >
            <NavigateCloseIcon />
          </IconButton>
        )}
      />
    )
  }

  renderMiddleScrollingSection() {
    const { contact } = this.props.data
    return (
      <MessageList
        contact={contact}
        messages={contact.messages}
      />
    )
  }

  renderBottomFixedSection() {
    return (
      <div>
        {this.renderSurveySection()}
        <div>
          <div className={css(styles.messageField)}>
            <TextField
              autoFocus
              ref='messageText'
              name='messageText'
              floatingLabelText='Your message'
              fullWidth
              multiLine
              onChange={(event) => this.setState({ messageText: event.target.value })}
              value={this.state.messageText}
            />
          </div>
          {this.renderActionToolbar()}
        </div>
        {this.renderOptOutDialog()}
        {this.renderCannedResponsePopover()}
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.state.sending ? (
          <div className={css(styles.overlay)}>
            <CircularProgress size={0.5} />
            Sending...
          </div>
        ) : ''
        }
        <div className={css(styles.container)}>
          <div className={css(styles.topFixedSection)}>
            {this.renderTopFixedSection()}
          </div>
          <div
            className={css(styles.middleScrollingSection)}
          >
            {this.renderMiddleScrollingSection()}
          </div>
          <div className={css(styles.bottomFixedSection)}>
            {this.renderBottomFixedSection()}
          </div>
        </div>
      </div>
    )
  }
}

AssignmentTexterContact.propTypes = {
  contact: React.PropTypes.object,
  campaign: React.PropTypes.object,
  assignment: React.PropTypes.object,
  texter: React.PropTypes.object,
  navigationToolbarChildren: React.PropTypes.array,
  onFinishContact: React.PropTypes.func,
  router: React.PropTypes.object,
  data: React.PropTypes.object,
  onExitTexter: React.PropTypes.func
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContact($campaignContactId: String!) {
      contact(id: $campaignContactId) {
        id
        firstName
        lastName
        cell
        customFields
        optOut {
          id
          createdAt
        }
        currentInteractionStepScript
        interactionSteps {
          id
          questionResponse(campaignContactId: $campaignContactId) {
            value
          }
          question {
            text
            answerOptions {
              value
              nextInteractionStep {
                id
                script
              }
            }
          }
        }
        location {
          city
          state
          timezone {
            offset
            hasDST
          }
        }
        messageStatus
        messages {
          id
          createdAt
          text
          isFromContact
        }
      }
    }`,
    variables: {
      campaignContactId: ownProps.campaignContactId
    },
    forceFetch: true
  }
})

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut($optOut: OptOutInput!, $campaignContactId: String!) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
          optOut {
            id
            createdAt
          }
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  }),
  editCampaignContactMessageStatus: (messageStatus, campaignContactId) => ({
    mutation: gql`
      mutation editCampaignContactMessageStatus($messageStatus: String!, $campaignContactId: String!) {
        editCampaignContactMessageStatus(messageStatus:$messageStatus, campaignContactId: $campaignContactId) {
          id
          messageStatus
        }
      }
    `,
    variables: {
      messageStatus,
      campaignContactId
    }
  }),
  deleteQuestionResponses: (interactionStepIds, campaignContactId) => ({
    mutation: gql`
      mutation deleteQuestionResponses($interactionStepIds:[String], $campaignContactId: String!) {
        deleteQuestionResponses(interactionStepIds: $interactionStepIds, campaignContactId: $campaignContactId) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    }
  }),
  updateQuestionResponses: (questionResponses, campaignContactId) => ({
    mutation: gql`
      mutation updateQuestionResponses($questionResponses:[QuestionResponseInput], $campaignContactId: String!) {
        updateQuestionResponses(questionResponses: $questionResponses, campaignContactId: $campaignContactId) {
          id
        }
      }
    `,
    variables: {
      questionResponses,
      campaignContactId
    }
  }),
  sendMessage: (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage($message: MessageInput!, $campaignContactId: String!) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
            isFromContact
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    }
  })
})

export default loadData(wrapMutations(
  withRouter(AssignmentTexterContact)), {
    mapQueriesToProps,
    mapMutationsToProps
  })
