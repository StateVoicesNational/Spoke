import PropTypes from 'prop-types'
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
  logoImageUrl
  introHtml
  primaryColor
  texters {
    id
    firstName
    lastName
    assignment(campaignId:$campaignId) {
      contactsCount
      needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
      maxContacts
    }
  }
  interactionSteps {
    id
    questionText
    script
    answerOption
    answerActions
    parentInteractionId
    isDeleted
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
    // This should only update the campaignFormValues sections that
    // are NOT expanded so the form data doesn't compete with the user
    // The basic flow of data:
    // 1. User adds data to a section -> this.state.campaignFormValues
    // 2. User saves -> (handleSave) mutations.editCampaign ->
    // 3. Refetch/poll updates data in loadData component wrapper
    //    and triggers *this* method => this.props.campaignData => this.state.campaignFormValues
    // So campaignFormValues should always be the diffs between server and client form data
    let { expandedSection } = this.state
    let expandedKeys = []
    if (expandedSection !== null) {
      expandedSection = this.sections()[expandedSection]
      expandedKeys = expandedSection.keys
    }

    const campaignDataCopy = {
      ...newProps.campaignData.campaign
    }
    expandedKeys.forEach((key) => {
      // contactsCount is in two sections
      // That means it won't get updated if *either* is opened
      // but we want it to update in either
      if (key === 'contactsCount') {
        return
      }
      delete campaignDataCopy[key]
    })
    // NOTE: Since this does not _deep_ copy the values the
    // expandedKey pointers will remain the same object as before
    // so setState passes on those subsections should1 not refresh
    let pushToFormValues = {
      ...this.state.campaignFormValues,
      ...campaignDataCopy
    }
    // contacts and contactSql need to be *deleted*
    // when contacts are done on backend so that Contacts section
    // can be marked saved, but only when user is NOT editing Contacts
    if (campaignDataCopy.contactsCount > 0) {
      const specialCases = ['contacts', 'contactSql']
      specialCases.forEach((key) => {
        if (expandedKeys.indexOf(key) === -1) {
          delete pushToFormValues[key]
        }
      })
    }

    this.setState({
      campaignFormValues: pushToFormValues
    })
  }

  onExpandChange = (index, newExpandedState) => {
    const { expandedSection } = this.state

    if (newExpandedState) {
      this.setState({ expandedSection: index })
    } else if (index === expandedSection) {
      this.setState({ expandedSection: null })
    }
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
    this.props.campaignData.refetch()
  }

  handleSave = async () => {
    // only save the current expanded section
    const { expandedSection } = this.state
    if (expandedSection === null) {
      return
    }

    const section = this.sections()[expandedSection]
    let newCampaign = {}
    if (this.checkSectionSaved(section)) {
      return // already saved and no data changes
    } else {
      newCampaign = {
        ...this.getSectionState(section)
      }
    }

    if (Object.keys(newCampaign).length > 0) {
      // Transform the campaign into an input understood by the server
      delete newCampaign.customFields
      delete newCampaign.contactsCount
      if (newCampaign.hasOwnProperty('contacts') && newCampaign.contacts) {
        const contactData = newCampaign.contacts.map((contact) => {
          const customFields = {}
          const contactInput = {
            cell: contact.cell,
            firstName: contact.firstName,
            lastName: contact.lastName,
            zip: contact.zip || '',
            external_id: contact.external_id || ''
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
          maxContacts: texter.assignment.maxContacts,
          contactsCount: texter.assignment.contactsCount
        }))
      }
      if (newCampaign.hasOwnProperty('interactionSteps')) {
        newCampaign.interactionSteps = Object.assign({}, newCampaign.interactionSteps)
      }
      await this
        .props
        .mutations
        .editCampaign(this.props.campaignData.campaign.id, newCampaign)

      this.pollDuringActiveJobs()
    }
  }

  async pollDuringActiveJobs(noMore) {
    const pendingJobs = await this.props.pendingJobsData.refetch()
    if (pendingJobs.length && !noMore) {
      const self = this
      setTimeout(function () {
        // run it once more after there are no more jobs
        self.pollDuringActiveJobs(true)
      }, 1000)
    }
    this.props.campaignData.refetch()
  }

  checkSectionSaved(section) {
    // Tests section's keys of campaignFormValues against props.campaignData
    // * Determines greyness of section button
    // * Determine if section is marked done (in green) along with checkSectionCompleted()
    // * Must be false for a section to save!!
    // Only Contacts section implements checkSaved()
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
      keys: ['title', 'description', 'dueBy', 'logoImageUrl', 'primaryColor', 'introHtml'],
      blocksStarting: true,
      expandAfterCampaignStarts: true,
      expandableBySuperVolunteers: true,
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
        // Must be false for save to be tried
        // Must be true for green bar, etc.
        // This is a little awkward because neither of these fields are 'updated'
        //   from the campaignData query, so we must delete them after save/update
        //   at the right moment (see componentWillReceiveProps)
        this.state.campaignFormValues.contactsCount > 0
        && this.state.campaignFormValues.hasOwnProperty('contacts') === false
        && this.state.campaignFormValues.hasOwnProperty('contactSql') === false),
      blocksStarting: true,
      expandAfterCampaignStarts: false,
      expandableBySuperVolunteers: false,
      extraProps: {
        optOuts: [], // this.props.organizationData.organization.optOuts, // <= doesn't scale
        datawarehouseAvailable: this.props.campaignData.campaign.datawarehouseAvailable,
        jobResultMessage: ((this.props.pendingJobsData.campaign.pendingJobs.filter((job) => (/contacts/.test(job.jobType)))[0] || {}).resultMessage || '')
      }
    }, {
      title: 'Texters',
      content: CampaignTextersForm,
      keys: ['texters', 'contactsCount', 'useDynamicAssignment'],
      checkCompleted: () => (this.state.campaignFormValues.texters.length > 0 && this.state.campaignFormValues.contactsCount === this.state.campaignFormValues.texters.reduce(((left, right) => left + right.assignment.contactsCount), 0)) || this.state.campaignFormValues.useDynamicAssignment === true,
      blocksStarting: false,
      expandAfterCampaignStarts: true,
      expandableBySuperVolunteers: true,
      extraProps: {
        orgTexters: this.props.organizationData.organization.texters,
        organizationUuid: this.props.organizationData.organization.uuid,
        campaignId: this.props.campaignData.campaign.id
      }
    }, {
      title: 'Interactions',
      content: CampaignInteractionStepsForm,
      keys: ['interactionSteps'],
      checkCompleted: () => this.state.campaignFormValues.interactionSteps.length > 0,
      blocksStarting: true,
      expandAfterCampaignStarts: true,
      expandableBySuperVolunteers: false,
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
      expandAfterCampaignStarts: true,
      expandableBySuperVolunteers: true,
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
    let jobMessage = null
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
      sectionIsSaving = !relatedJob.resultMessage
      savePercent = relatedJob.status
      jobMessage = relatedJob.resultMessage
    }
    return {
      sectionIsSaving,
      savePercent,
      jobMessage
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
        saveLabel={this.isNew() ? 'Save and goto next section' : 'Save'}
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
    if (!this.props.params.adminPerms) {
      // Supervolunteers don't have access to start the campaign or un/archive it
      return null
    }
    let isCompleted = this.props.pendingJobsData.campaign
      .pendingJobs.filter((job) => /Error/.test(job.resultMessage || '')).length === 0
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
    const sections = this.sections()
    const { expandedSection } = this.state
    const { adminPerms } = this.props.params
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
          const sectionCanExpandOrCollapse = (
            (section.expandAfterCampaignStarts
             || !this.props.campaignData.campaign.isStarted)
            && (adminPerms || section.expandableBySuperVolunteers))

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
          } else if (sectionIsExpanded && sectionCanExpandOrCollapse) {
            cardHeaderStyle.backgroundColor = theme.colors.lightYellow
          } else if (!sectionCanExpandOrCollapse) {
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
              expanded={sectionIsExpanded && sectionCanExpandOrCollapse}
              expandable={sectionCanExpandOrCollapse}
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
                actAsExpander={!sectionIsSaving && sectionCanExpandOrCollapse}
                showExpandableButton={!sectionIsSaving && sectionCanExpandOrCollapse}
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
  campaignData: PropTypes.object,
  mutations: PropTypes.object,
  organizationData: PropTypes.object,
  params: PropTypes.object,
  location: PropTypes.object,
  pendingJobsData: PropTypes.object,
  availableActionsData: PropTypes.object
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
          resultMessage
        }
      }
    }`,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    pollInterval: 60000
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
    pollInterval: 60000
  },
  organizationData: {
    query: gql`query getOrganizationData($organizationId: String!) {
      organization(id: $organizationId) {
        id
        uuid
        texters: people {
          id
          firstName
          lastName
          displayName
        }
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    pollInterval: 20000
  },
  availableActionsData: {
    query: gql`query getActions($organizationId: String!) {
      availableActions(organizationId: $organizationId) {
        name
        display_name
        instructions
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    },
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
  editCampaign(campaignId, campaign) {
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
