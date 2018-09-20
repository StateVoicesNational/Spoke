import React, { Component } from 'react'
import _ from 'lodash'

import IncomingMessageActions from '../components/IncomingMessageActions'
import IncomingMessageFilter from '../components/IncomingMessageFilter'
import IncomingMessageList from '../components/IncomingMessageList'
import LoadingIndicator from '../components/LoadingIndicator'
import PaginatedCampaignsRetriever from './PaginatedCampaignsRetriever'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import wrapMutations from './hoc/wrap-mutations'
import PaginatedUsersRetriever from './PaginatedUsersRetriever'

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
  let isArchived = undefined
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false
  }

  if (isArchived !== undefined) {
    return { isArchived }
  }

  return {}
}

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut }
  }

  return {}
}

export class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      page: 0,
      pageSize: 10,
      campaignsFilter: { isArchived: false },
      contactsFilter: { isOptedOut: false },
      assignmentsFilter: {},
      needsRender: false,
      utc: Date.now().toString(),
      campaigns: [],
      reassignmentTexters: [],
      campaignTexters: [],
      includeArchivedCampaigns: false,
      includeActiveCampaigns: true,
      includeNotOptedOutConversations: true,
      includeOptedOutConversations: false
    }

    this.handleCampaignChanged = this.handleCampaignChanged.bind(this)
    this.handleMessageFilterChange = this.handleMessageFilterChange.bind(this)
    this.handleReassignRequested = this.handleReassignRequested.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handlePageSizeChange = this.handlePageSizeChange.bind(this)
    this.handleRowSelection = this.handleRowSelection.bind(this)
    this.handleCampaignsReceived = this.handleCampaignsReceived.bind(this)
    this.handleCampaignTextersReceived = this.handleCampaignTextersReceived.bind(
      this
    )
    this.handleReassignmentTextersReceived = this.handleReassignmentTextersReceived.bind(
      this
    )
    this.handleTexterChanged = this.handleTexterChanged.bind(this)
    this.handleArchivedCampaignsToggled = this.handleArchivedCampaignsToggled.bind(
      this
    )
    this.handleActiveCampaignsToggled = this.handleActiveCampaignsToggled.bind(
      this
    )
    this.handleNotOptedOutConversationsToggled = this.handleNotOptedOutConversationsToggled.bind(
      this
    )
    this.handleOptedOutConversationsToggled = this.handleOptedOutConversationsToggled.bind(
      this
    )
  }

  shouldComponentUpdate(dummy, nextState) {
    if (
      !nextState.needsRender &&
      _.isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      _.isEqual(this.state.campaignsFilter, nextState.campaignsFilter) &&
      _.isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter)
    ) {
      return false
    }
    return true
  }

  async handleCampaignChanged(campaignId) {
    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    if (campaignId !== -1) {
      campaignsFilter.campaignId = campaignId
    }

    await this.setState({
      campaignsFilter,
      needsRender: true
    })
  }

  async handleTexterChanged(texterId) {
    const assignmentsFilter = {}
    if (texterId >= 0) {
      assignmentsFilter.texterId = texterId
    }
    await this.setState({
      assignmentsFilter,
      needsRender: true
    })
  }

  async handleMessageFilterChange(messagesFilter) {
    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['messageStatus']),
      { messageStatus: messagesFilter }
    )
    await this.setState({
      contactsFilter,
      needsRender: true
    })
  }

  async handleReassignRequested(newTexterUserId) {
    await this.props.mutations.reassignCampaignContacts(
      this.props.params.organizationId,
      this.state.campaignIdsContactIds,
      newTexterUserId
    )
    this.setState({
      utc: Date.now().toString(),
      needsRender: true
    })
  }

  async handlePageChange(page) {
    await this.setState({
      page,
      needsRender: true
    })
  }

  async handlePageSizeChange(pageSize) {
    await this.setState({ needsRender: true, pageSize })
  }

  async handleRowSelection(selectedRows, data) {
    if (this.state.previousSelectedRows === 'all' && selectedRows !== 'all') {
      await this.setState({
        previousSelectedRows: [],
        campaignIdsContactIds: [],
        needsRender: false
      })
    } else {
      await this.setState({
        previousSelectedRows: selectedRows,
        campaignIdsContactIds: data,
        needsRender: false
      })
    }
  }

  async handleCampaignsReceived(campaigns) {
    this.setState({ campaigns, needsRender: true })
  }

  async handleCampaignTextersReceived(campaignTexters) {
    this.setState({ campaignTexters, needsRender: true })
  }

  async handleReassignmentTextersReceived(reassignmentTexters) {
    this.setState({ reassignmentTexters, needsRender: true })
  }

  async handleNotOptedOutConversationsToggled() {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    )

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['isOptedOut']),
      contactsFilterUpdate
    )

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    })
  }

  async handleOptedOutConversationsToggled() {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    )

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ['isOptedOut']),
      contactsFilterUpdate
    )

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    })
  }

  async handleActiveCampaignsToggled() {
    if (
      this.state.includeActiveCampaigns &&
      !this.state.includeArchivedCampaigns
    ) {
      return
    }

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    this.setState({
      campaignsFilter,
      includeActiveCampaigns: !this.state.includeActiveCampaigns
    })
  }

  async handleArchivedCampaignsToggled() {
    const includeActiveCampaigns =
      this.state.includeActiveCampaigns || !this.state.includeArchivedCampaigns

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !this.state.includeArchivedCampaigns
    )

    this.setState({
      campaignsFilter,
      includeActiveCampaigns,
      includeArchivedCampaigns: !this.state.includeArchivedCampaigns
    })
  }

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    }
    return (
      <div>
        <h3> Message Review </h3>
        {this.props.organization && this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <div>
            <PaginatedUsersRetriever
              organizationId={this.props.params.organizationId}
              onUsersReceived={this.handleReassignmentTextersReceived}
              pageSize={1000}
            />
            <PaginatedUsersRetriever
              organizationId={this.props.params.organizationId}
              onUsersReceived={this.handleCampaignTextersReceived}
              pageSize={1000}
              campaignsFilter={this.state.campaignsFilter}
            />
            <PaginatedCampaignsRetriever
              organizationId={this.props.params.organizationId}
              campaignsFilter={_.pick(this.state.campaignsFilter, 'isArchived')}
              onCampaignsReceived={this.handleCampaignsReceived}
              pageSize={1000}
            />
            <IncomingMessageFilter
              campaigns={this.state.campaigns}
              texters={this.state.campaignTexters}
              onCampaignChanged={this.handleCampaignChanged}
              onTexterChanged={this.handleTexterChanged}
              onMessageFilterChanged={this.handleMessageFilterChange}
              assignmentsFilter={this.state.assignmentsFilter}
              onActiveCampaignsToggled={this.handleActiveCampaignsToggled}
              onArchivedCampaignsToggled={this.handleArchivedCampaignsToggled}
              includeActiveCampaigns={this.state.includeActiveCampaigns}
              includeArchivedCampaigns={this.state.includeArchivedCampaigns}
              onNotOptedOutConversationsToggled={
                this.handleNotOptedOutConversationsToggled
              }
              onOptedOutConversationsToggled={
                this.handleOptedOutConversationsToggled
              }
              includeNotOptedOutConversations={
                this.state.includeNotOptedOutConversations
              }
              includeOptedOutConversations={
                this.state.includeOptedOutConversations
              }
            />
            <br />
            <IncomingMessageActions
              people={this.state.reassignmentTexters}
              onReassignRequested={this.handleReassignRequested}
            />
            <br />
            <IncomingMessageList
              organizationId={this.props.params.organizationId}
              cursor={cursor}
              contactsFilter={this.state.contactsFilter}
              campaignsFilter={this.state.campaignsFilter}
              assignmentsFilter={this.state.assignmentsFilter}
              utc={this.state.utc}
              onPageChanged={this.handlePageChange}
              onPageSizeChanged={this.handlePageSizeChange}
              onConversationSelected={this.handleRowSelection}
            />
          </div>
        )}
      </div>
    )
  }
}

// TODO(lmp) don't need mapQueriesToProps
const mapQueriesToProps = ({ ownProps }) => ({
  organization: {
    query: gql`
      query Q($organizationId: String!) {
        organization(id: $organizationId) {
          id
          people {
            id
            displayName
            roles(organizationId: $organizationId)
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

const mapMutationsToProps = () => ({
  reassignCampaignContacts: (
    organizationId,
    campaignIdsContactIds,
    newTexterUserId
  ) => ({
    mutation: gql`
      mutation reassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserId: String!
      ) {
        reassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserId: $newTexterUserId
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserId }
  })
})

export default loadData(withRouter(wrapMutations(AdminIncomingMessageList)), {
  mapQueriesToProps,
  mapMutationsToProps
})
