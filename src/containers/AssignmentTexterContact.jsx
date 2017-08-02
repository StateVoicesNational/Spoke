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
import CircularProgress from 'material-ui/CircularProgress'
import Snackbar from 'material-ui/Snackbar'
import { getChildren, getTopMostParent, interactionStepForId, log, isBetweenTextingHours } from '../lib'
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
    maxWidth: '50%'
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
  },
  dialogActions: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  }
})

const inlineStyles = {
  dialogButton: {
    display: 'inline-block'
  },
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
  },
  snackbar: {
    zIndex: 1000001
  }
}

class AssignmentTexterContact extends React.Component {

  constructor(props) {
    super(props)

    const questionResponses = this.getInitialQuestionResponses(props.data.contact.interactionSteps)
    const availableSteps = this.getAvailableInteractionSteps(questionResponses)

    const { assignment, campaign } = this.props
    const { contact } = this.props.data
    let disabled = false
    let disabledText = 'Sending...'
    let snackbarOnTouchTap = null
    let snackbarActionTitle = null
    let snackbarError = null
    if (assignment.id !== contact.assignmentId || campaign.isArchived) {
      disabledText = ''
      disabled = true
      snackbarError = 'Your assignment has changed'
      snackbarOnTouchTap = this.goBackToTodos
      snackbarActionTitle = 'Back to Todos'
    } else if (contact.optOut) {
      disabledText = 'Skipping opt-out...'
      disabled = true
    } else if (!this.isContactBetweenTextingHours(contact)) {
      disabledText = "Refreshing because it's now out of texting hours for some of your contacts"
      disabled = true
    }

    this.state = {
      disabled,
      disabledText,
      questionResponses,
      snackbarError,
      snackbarActionTitle,
      snackbarOnTouchTap,
      optOutMessageText: "I'm opting you out of texts immediately. Have a great day.",
      responsePopoverOpen: false,
      messageText: this.getStartingMessageText(),
      optOutDialogOpen: false,
      currentInteractionStep: availableSteps.length > 0 ? availableSteps[availableSteps.length - 1] : null
    }
  }

  componentDidMount() {
    const { contact } = this.props.data
    if (contact.optOut) {
      this.skipContact()
    } else if (!this.isContactBetweenTextingHours(contact)) {
      setTimeout(() => {
        this.props.onRefreshAssignmentContacts()
        this.setState({ disabled: false })
      }, 1500)
    }

    const node = this.refs.messageScrollContainer
    // Does not work without this setTimeout
    setTimeout(() => { node.scrollTop = Math.floor(node.scrollHeight) }, 0)
  }

  getAvailableInteractionSteps(questionResponses) {
    const allInteractionSteps = this.props.data.contact.interactionSteps

    const availableSteps = []

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
    const questionResponses = {}
    for (const interactionStep of interactionSteps) {
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
    return messages.length > 0 ? '' : this.getMessageTextFromScript(contact.currentInteractionStepScript)
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

  goBackToTodos = () => {
    const { campaign } = this.props
    this.props.router.push(`/app/${campaign.organization.id}/todos`)
  }

  handleSendMessageError = (e) => {
    if (e.status === 402) {
      this.goBackToTodos()
    } else if (e.status === 400) {
      const newState = {
        snackbarError: e.message
      }

      if (e.message === 'Your assignment has changed') {
        newState.snackbarActionTitle = 'Back to todos'
        newState.snackbarOnTouchTap = this.goBackToTodos
        this.setState(newState)
      } else {
        // opt out or send message Error
        this.setState({
          disabled: true,
          disabledText: e.message
        })
        this.skipContact()
      }
    } else {
      log.error(e)
      this.setState({
        snackbarError: 'Something went wrong!'
      })
    }
  }

  handleMessageFormSubmit = async ({ messageText }) => {
    try {
      const { contact } = this.props.data
      const message = this.createMessageToContact(messageText)
      this.setState({ disabled: true })
      await this.props.mutations.sendMessage(message, contact.id)

      await this.handleSubmitSurveys()
      this.props.onFinishContact()
    } catch (e) {
      this.handleSendMessageError(e)
    }
  }

  handleSubmitSurveys = async () => {
    const { contact } = this.props.data

    const deletionIds = []
    const questionResponseObjects = []

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
    try {
      await this.props.mutations.sendMessage(message, contact.id)
      const optOut = {
        cell: contact.cell,
        assignmentId: assignment.id
      }

      await this.handleSubmitSurveys()
      await this.props.mutations.createOptOut(optOut, contact.id)
      this.props.onFinishContact()
    } catch (e) {
      this.handleSendMessageError(e)
    }
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
    for (const childStep of children) {
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


  handleClickSendMessageButton = () => {
    this.refs.form.submit()
  }

  isContactBetweenTextingHours(contact) {
    const { campaign } = this.props

    let timezoneData = null

    if (contact.location) {
      const { hasDST, offset } = contact.location.timezone

      timezoneData = { hasDST, offset }
    }
    const { textingHoursStart, textingHoursEnd, textingHoursEnforced } = campaign.organization
    const config = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced
    }
    return isBetweenTextingHours(timezoneData, config)
  }

  optOutSchema = yup.object({
    optOutMessageText: yup.string().required()
  })

  skipContact = () => {
    setTimeout(this.props.onFinishContact, 1500)
  }

  messageSchema = yup.object({
    messageText: yup.string().required("Can't send empty message")
  })

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText })

  renderMiddleScrollingSection() {
    const { contact } = this.props.data
    return (
      <MessageList
        contact={contact}
        messages={contact.messages}
      />
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
            disabled={this.state.disabled}
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
    const actions = [

    ]

    return (
      <div>
        <Dialog
          title='Opt out user'
          actions={actions}
          modal={false}
          open={this.state.optOutDialogOpen}
          onRequestClose={this.handleCloseDialog}
        >
          <GSForm
            schema={this.optOutSchema}
            onChange={({ optOutMessageText }) => this.setState({ optOutMessageText })}
            value={{ optOutMessageText: this.state.optOutMessageText }}
            onSubmit={this.handleOptOut}
          >
            <Form.Field
              name='optOutMessageText'
              fullWidth
              autoFocus
              multiLine
            />
            <div className={css(styles.dialogActions)}>
              <FlatButton
                style={inlineStyles.dialogButton}
                label='Cancel'
                onTouchTap={this.handleCloseDialog}
              />,
              <Form.Button
                type='submit'
                style={inlineStyles.dialogButton}
                component={GSSubmitButton}
                label='Send message and opt out user'
              />
            </div>
          </GSForm>
        </Dialog>

      </div>
    )
  }

  renderBottomFixedSection() {
    return (
      <div>
        {this.renderSurveySection()}
        <div>
          <div className={css(styles.messageField)}>
            <GSForm
              ref='form'
              schema={this.messageSchema}
              value={{ messageText: this.state.messageText }}
              onSubmit={this.handleMessageFormSubmit}
              onChange={this.handleMessageFormChange}
            >
              <Form.Field
                name='messageText'
                label='Your message'
                multiLine
                fullWidth
              />
            </GSForm>
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
        {this.state.disabled ? (
          <div className={css(styles.overlay)}>
            <CircularProgress size={0.5} />
            {this.state.disabledText}
          </div>
        ) : ''
        }
        <div className={css(styles.container)}>
          <div className={css(styles.topFixedSection)}>
            {this.renderTopFixedSection()}
          </div>
          <div
            ref='messageScrollContainer'
            className={css(styles.middleScrollingSection)}
          >
            {this.renderMiddleScrollingSection()}
          </div>
          <div className={css(styles.bottomFixedSection)}>
            {this.renderBottomFixedSection()}
          </div>
        </div>
        <Snackbar
          style={inlineStyles.snackbar}
          open={!!this.state.snackbarError}
          message={this.state.snackbarError}
          action={this.state.snackbarActionTitle}
          onActionTouchTap={this.state.snackbarOnTouchTap}
        />
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
  mutations: React.PropTypes.object,
  onExitTexter: React.PropTypes.func,
  onRefreshAssignmentContacts: React.PropTypes.func
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getContact($campaignContactId: String!) {
      contact(id: $campaignContactId) {
        id
        assignmentId
        firstName
        lastName
        cell
        zip
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
