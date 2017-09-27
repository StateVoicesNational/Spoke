import React from 'react'
import WarningIcon from 'material-ui/svg-icons/alert/warning'
import DoneIcon from 'material-ui/svg-icons/action/done'
import Avatar from 'material-ui/Avatar'
import theme from '../styles/theme'
import CircularProgress from 'material-ui/CircularProgress'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import RaisedButton from 'material-ui/RaisedButton'
import CampaignBasicsForm from '../components/CampaignBasicsForm'
import CampaignContactsForm from '../components/CampaignContactsForm'
import CampaignTextersForm from '../components/CampaignTextersForm'
import CampaignInteractionStepsForm from '../components/CampaignInteractionStepsForm'
import CampaignCannedResponsesForm from '../components/CampaignCannedResponsesForm'

const campaignInfoFragment = `
  id
  title
  description
  dueBy
  isStarted
  isArchived
  contactsCount
  datawarehouseAvailable
  customFields
  useDynamicAssignment
  texters {
    id
    firstName
    assignment(campaignId:$campaignId) {
      contactsCount
      needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
      maxContacts
    }
  }
  interactionSteps {
    id
    script
    question {
      text
      answerOptions {
        value
        action
        nextInteractionStep {
          id
        }
      }
    }
  }
  cannedResponses {
    id
    title
    text
  }
`

class AdminCampaignEdit extends React.Component {
  constructor(props) {
    super(props)
    const isNew = props.location.query.new
    this.state = {
      expandedSection: isNew ? 0 : null,
      campaignFormValues: props.campaignData.campaign,
      startingCampaign: false
    }
  }

  componentWillReceiveProps(newProps) {
    let { expandedSection } = this.state
    let expandedKeys = []
    if (expandedSection !== null) {
      expandedSection = this.sections()[expandedSection]
      if (this.sectionSaveStatus(expandedSection).sectionIsSaving) {
        expandedKeys = []
      } else {
        expandedKeys = expandedSection.keys
      }
    }

    const campaignDataCopy = {
      ...newProps.campaignData.campaign
    }
    expandedKeys.forEach((key) => {
      delete campaignDataCopy[key]
    })

    this.setState({
      campaignFormValues: {
        ...this.state.campaignFormValues,
        ...campaignDataCopy
      }
    })
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state
    if (newExpandedState) {
      this.setState({ expandedSection: index })
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null })
    }
    this.handleSave()
  }

  getSectionState(section) {
    const sectionState = {}
    section.keys.forEach((key) => {
      sectionState[key] = this.state.campaignFormValues[key]
    })
    return sectionState
  }

  isNew() {
    return this.props.location.query.new
  }

  handleChange = (formValues) => {
    this.setState({
      campaignFormValues: {
        ...this.state.campaignFormValues,
        ...formValues
      }
    })
  }

  handleSubmit = async () => {
    await this.handleSave()
    this.setState({
      expandedSection: this.state.expandedSection >= this.sections().length - 1 ||
        !this.isNew() ?
          null : this.state.expandedSection + 1
    }) // currently throws an unmounted component error in the console
  }
         
  handleSave = async () => {
    let saveObject = {}
    this.sections().forEach((section) => {
      if (!this.checkSectionSaved(section)) {
        saveObject = {
          ...saveObject,
          ...this.getSectionState(section)
        }
      }
    })
    if (Object.keys(saveObject).length > 0) {
      // Transform the campaign into an input understood by the server
      const newCampaign = {
        ...saveObject
      }
      delete newCampaign.customFields
      delete newCampaign.contactsCount
      if (newCampaign.hasOwnProperty('contacts') && newCampaign.contacts) {
        const contactData = newCampaign.contacts.map((contact) => {
          const customFields = {}
          const contactInput = {
            cell: contact.cell,
            firstName: contact.firstName,
            lastName: contact.lastName,
            zip: contact.zip,
            external_id: contact.zip
          }
          Object.keys(contact).forEach((key) => {
            if (!contactInput.hasOwnProperty(key)) {
              customFields[key] = contact[key]
            }
          })
          contactInput.customFields = JSON.stringify(customFields)
          return contactInput
        })
        newCampaign.contacts = contactData
        newCampaign.texters = []
      } else {
        newCampaign.contacts = null
      }

      if (newCampaign.hasOwnProperty('texters')) {
        newCampaign.texters = newCampaign.texters.map((texter) => ({
          id: texter.id,
          needsMessageCount: texter.assignment.needsMessageCount,
          maxContacts: texter.assignment.maxContacts
        }))
      }

      if (newCampaign.hasOwnProperty('interactionSteps')) {
        newCampaign.interactionSteps = newCampaign.interactionSteps.map((step) => ({
          id: step.id,
          question: step.question ? step.question.text : null,
          script: step.script,
          answerOptions: step.question ? step.question.answerOptions.map((answer) => ({
            value: answer.value,
            action: answer.action,
            nextInteractionStepId: answer.nextInteractionStep ? answer.nextInteractionStep.id : null
          })) : []
        }))
      }

      await this
        .props
        .mutations
        .editCampaign(this.props.campaignData.campaign.id, newCampaign)
      this.setState({
        campaignFormValues: this.props.campaignData.campaign
      })
    }
  }

  checkSectionSaved(section) {
    if (section.hasOwnProperty('checkSaved')) {
      return section.checkSaved()
    }
    const sectionState = {}
    const sectionProps = {}
    section.keys.forEach((key) => {
      sectionState[key] = this.state.campaignFormValues[key]
      sectionProps[key] = this.props.campaignData.campaign[key]
    })
    if (JSON.stringify(sectionState) !== JSON.stringify(sectionProps)) {
      return false
    }
    return true
  }

  checkSectionCompleted(section) {
    return section.checkCompleted()
  }

  sections() {
    return [{
      title: 'Basics',
      content: CampaignBasicsForm,
      keys: ['title', 'description', 'dueBy'],
      blocksStarting: true,
      checkCompleted: () => (
        this.state.campaignFormValues.title !== '' &&
          this.state.campaignFormValues.description !== '' &&
          this.state.campaignFormValues.dueBy !== null
      )
    }, {
      title: 'Contacts',
      content: CampaignContactsForm,
      keys: ['contacts', 'contactsCount', 'customFields', 'contactSql'],
      checkCompleted: () => this.state.campaignFormValues.contactsCount > 0,
      checkSaved: () => (
        // should we go and try to save contacts now?
        this.state.campaignFormValues.hasOwnProperty('contacts') === false
        && this.state.campaignFormValues.hasOwnProperty('contactSql') === false),
      blocksStarting: true,
      extraProps: {
        optOuts: this.props.organizationData.organization.optOuts,
        datawarehouseAvailable: this.props.campaignData.campaign.datawarehouseAvailable
      }
    }, {
      title: 'Texters',
      content: CampaignTextersForm,
      keys: ['texters', 'contactsCount', 'useDynamicAssignment'],
      checkCompleted: () => this.state.campaignFormValues.texters.length > 0 && this.state.campaignFormValues.contactsCount === this.state.campaignFormValues.texters.reduce(((left, right) => left + right.assignment.contactsCount), 0),
      blocksStarting: false,
      extraProps: {
        orgTexters: this.props.organizationData.organization.texters,
        organizationUuid: this.props.organizationData.organization.uuid
      }
    }, {
      title: 'Interactions',
      content: CampaignInteractionStepsForm,
      keys: ['interactionSteps'],
      checkCompleted: () => this.state.campaignFormValues.interactionSteps.length > 0 && this.state.campaignFormValues.interactionSteps[0].script !== '',
      blocksStarting: true,
      extraProps: {
        customFields: this.props.campaignData.campaign.customFields,
        availableActions: this.props.availableActionsData.availableActions
      }
    }, {
      title: 'Canned Responses',
      content: CampaignCannedResponsesForm,
      keys: ['cannedResponses'],
      checkCompleted: () => true,
      blocksStarting: true,
      extraProps: {
        customFields: this.props.campaignData.campaign.customFields
      }
    }]
  }

  sectionSaveStatus(section) {
    const pendingJobs = this.props.pendingJobsData.campaign.pendingJobs
    let sectionIsSaving = false
    let relatedJob = null
    let savePercent = 0
    if (pendingJobs.length > 0) {
      if (section.title === 'Contacts') {
        relatedJob = pendingJobs.filter((job) => (job.jobType === 'upload_contacts' || job.jobType === 'contact_sql'))[0]
      } else if (section.title === 'Texters') {
        relatedJob = pendingJobs.filter((job) => job.jobType === 'assign_texters')[0]
      } else if (section.title === 'Interactions') {
        relatedJob = pendingJobs.filter((job) => job.jobType === 'create_interaction_steps')[0]
      }
    }

    if (relatedJob) {
      sectionIsSaving = true
      savePercent = relatedJob.status
    }
    return {
      sectionIsSaving,
      savePercent
    }
  }

  renderCampaignFormSection(section, forceDisable) {
    let shouldDisable = forceDisable || (!this.isNew() && this.checkSectionSaved(section))
    const ContentComponent = section.content
    const formValues = this.getSectionState(section)
    return (
      <ContentComponent
        onChange={this.handleChange}
        formValues={formValues}
        saveLabel={this.isNew() ? 'Next' : 'Save'}
        saveDisabled={shouldDisable}
        ensureComplete={this.props.campaignData.campaign.isStarted}
        onSubmit={this.handleSubmit}
        {...section.extraProps}
      />
    )
  }

  renderHeader() {
    const notStarting = this.props.campaignData.campaign.isStarted ? (
      <div
        style={{
          color: theme.colors.green,
          fontWeight: 800
        }}
      >
        This campaign is running!
      </div>
      ) :
      this.renderStartButton()

    return (
      <div
        style={{
          marginBottom: 15,
          fontSize: 16
        }}
      >
          {this.state.startingCampaign ? (
            <div
              style={{
                color: theme.colors.gray,
                fontWeight: 800
              }}
            >
              <CircularProgress
                size={0.5}
                style={{
                  verticalAlign: 'middle',
                  display: 'inline-block'
                }}
              />
              Starting your campaign...
            </div>
          ) : notStarting}
      </div>
    )
  }

  renderStartButton() {
    let isCompleted = this.props.pendingJobsData.campaign.pendingJobs.length === 0
    this.sections().forEach((section) => {
      if (section.blocksStarting && !this.checkSectionCompleted(section) || !this.checkSectionSaved(section)) {
        isCompleted = false
      }
    })

    return (
      <div
        style={{
          ...theme.layouts.multiColumn.container
        }}
      >
        <div
          style={{
            ...theme.layouts.multiColumn.flexColumn
          }}
        >
          {isCompleted ? 'Your campaign is all good to go! >>>>>>>>>' : 'You need to complete all the sections below before you can start this campaign'}
        </div>
        <div>
          {this.props.campaignData.campaign.isArchived ? (
            <RaisedButton
              label='Unarchive'
              onTouchTap={async() => await this.props.mutations.unarchiveCampaign(this.props.campaignData.campaign.id)}
            />
          ) : (
            <RaisedButton
              label='Archive'
              onTouchTap={async() => await this.props.mutations.archiveCampaign(this.props.campaignData.campaign.id)}
            />
          )}
          <RaisedButton
            primary
            label='Start This Campaign!'
            disabled={!isCompleted}
            onTouchTap={async () => {
              this.setState({
                startingCampaign: true
              })
              await this.props.mutations.startCampaign(this.props.campaignData.campaign.id)
              this.setState({
                startingCampaign: false
              })
            }}
          />
        </div>
      </div>
    )
  }

  render() {
    const { expandedSection } = this.state
    const sections = this.sections()
    return (
      <div>
        {this.renderHeader()}
        {sections.map((section, sectionIndex) => {
          const sectionIsDone = this.checkSectionCompleted(section)
            && this.checkSectionSaved(section)
          const sectionIsExpanded = sectionIndex === expandedSection
          let avatar = null
          const cardHeaderStyle = {
            backgroundColor: theme.colors.lightGray
          }
          const avatarStyle = {
            display: 'inline-block',
            verticalAlign: 'middle'
          }

          const { sectionIsSaving, savePercent } = this.sectionSaveStatus(section)
          if (sectionIsSaving) {
            avatar = (<CircularProgress
              size={0.35}
              style={{
                verticalAlign: 'top',
                marginTop: '-13px',
                marginLeft: '-14px',
                marginRight: 36,
                display: 'inline-block',
                height: 20,
                width: 20
              }}
            />)
            cardHeaderStyle.background = theme.colors.lightGray
            cardHeaderStyle.width = `${savePercent}%`
          } else if (sectionIsExpanded) {
            cardHeaderStyle.backgroundColor = theme.colors.lightGray
          } else if (sectionIsDone) {
            avatar = (<Avatar
              icon={<DoneIcon style={{ fill: theme.colors.darkGreen }} />}
              style={avatarStyle}
              size={25}
            />)
            cardHeaderStyle.backgroundColor = theme.colors.green
          } else if (!sectionIsDone) {
            avatar = (<Avatar
              icon={<WarningIcon style={{ fill: theme.colors.orange }} />}
              style={avatarStyle}
              size={25}
            />)
            cardHeaderStyle.backgroundColor = theme.colors.yellow
          }

          return (
            <Card
              key={section.title}
              expanded={sectionIsExpanded}
              onExpandChange={(newExpandedState) =>
                this.onExpandChange(sectionIndex, newExpandedState)
              }
              style={{
                marginTop: 1
              }}
            >
              <CardHeader
                title={section.title}
                titleStyle={{
                  width: '100%'
                }}
                style={cardHeaderStyle}
                actAsExpander
                showExpandableButton={!sectionIsSaving}
                avatar={avatar}
              />
              <CardText
                expandable
              >
                 {this.renderCampaignFormSection(section, sectionIsSaving)}
              </CardText>
            </Card>
          )
        })}
      </div>
    )
  }
}

AdminCampaignEdit.propTypes = {
  campaignData: React.PropTypes.object,
  mutations: React.PropTypes.object,
  organizationData: React.PropTypes.object,
  params: React.PropTypes.object,
  location: React.PropTypes.object,
  pendingJobsData: React.PropTypes.object,
  availableActionsData: React.PropTypes.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  pendingJobsData: {
    query: gql`query getCampaignJobs($campaignId: String!) {
      campaign(id: $campaignId) {
        id
        pendingJobs {
          id
          jobType
          assigned
          status
        }
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    pollInterval: 10000
  },
  campaignData: {
    query: gql`query getCampaign($campaignId: String!) {
      campaign(id: $campaignId) {
        ${campaignInfoFragment}
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    pollInterval: 10000
  },
  organizationData: {
    query: gql`query getOrganizationData($organizationId: String!, $role: String!) {
      organization(id: $organizationId) {
        id
        uuid
        optOuts {
          cell
        }
        texters: people(role: $role) {
          id
          firstName
          displayName
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId,
      role: 'TEXTER'
    },
    pollInterval: 10000
  },
  availableActionsData: {
    query: gql`query getAction {
      availableActions {
        name
        display_name
      }
    }`,
    forceFetch: true
  }
})

// Right now we are copying the result fields instead of using a fragment because of https://github.com/apollostack/apollo-client/issues/451
const mapMutationsToProps = () => ({
  archiveCampaign: (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: (campaignId) => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  startCampaign: (campaignId) => ({
    mutation: gql`mutation startCampaign($campaignId: String!) {
        startCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  editCampaign: function(campaignId, campaign) {
    return ({
      mutation: gql`
        mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
          editCampaign(id: $campaignId, campaign: $campaign) {
            ${campaignInfoFragment}
          }
        },
      `,
      variables: {
        campaignId,
        campaign
      }
    })
  }
})

export default loadData(wrapMutations(AdminCampaignEdit), {
  mapQueriesToProps,
  mapMutationsToProps
})
