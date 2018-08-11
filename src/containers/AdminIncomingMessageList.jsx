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

export class AdminIncomingMessageList extends Component {

  constructor(props) {
    super(props)

    this.state = {
      page: 0,
      pageSize: 10,
      contactsFilter: {},
      campaignsFilter: {},
      campaignsFilterForTexterFiltering: { isArchived: false },
      assignmentsFilter: {},
      needsRender: false,
      utc: Date.now().toString(),
      campaigns: [],
      texters: []
    }

    this.handleCampaignChanged = this.handleCampaignChanged.bind(this)
    this.handleMessageFilterChange = this.handleMessageFilterChange.bind(this)
    this.handleReassignRequested = this.handleReassignRequested.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handlePageSizeChange = this.handlePageSizeChange.bind(this)
    this.handleRowSelection = this.handleRowSelection.bind(this)
    this.handleCampaignsReceived = this.handleCampaignsReceived.bind(this)
    this.handleUsersReceived = this.handleUsersReceived.bind(this)
    this.handleTexterChanged = this.handleTexterChanged.bind(this)
  }

  shouldComponentUpdate(_, nextState) {
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
    let campaignsFilter = {}
    let campaignsFilterForTexterFiltering = {isArchived:false}
    switch (campaignId) {
      case -1:
        break
      case -2:
        campaignsFilterForTexterFiltering = campaignsFilter = { isArchived: false }
        break
      case -3:
        campaignsFilterForTexterFiltering = campaignsFilter = { isArchived: true }
        break
      default:
        campaignsFilterForTexterFiltering = campaignsFilter = { campaignId }
    }
    await this.setState({
      campaignsFilterForTexterFiltering,
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
    await this.setState({
      contactsFilter: { messageStatus: messagesFilter },
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

  async handleUsersReceived(texters){
    this.setState({texters, needsRender: true})
  }

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    }
    return (
      <div>
        <h3> Message Review </h3>
        {(this.props.organization && this.props.organization.loading) ? (
          <LoadingIndicator/>
        ) : (
          <div>
            <PaginatedUsersRetriever
              organizationId={this.props.params.organizationId}
              onUsersReceived={this.handleUsersReceived}
              pageSize={1000}
              campaignsFilter={this.state.campaignsFilterForTexterFiltering}
            />
            <PaginatedCampaignsRetriever
              organizationId={this.props.params.organizationId}
              campaignsFilter={{ isArchived: false }}
              onCampaignsReceived={this.handleCampaignsReceived}
              pageSize={1000}
            />
            <IncomingMessageFilter
              campaigns={this.state.campaigns}
              texters={this.state.texters}
              onCampaignChanged={this.handleCampaignChanged}
              onTexterChanged={this.handleTexterChanged}
              onMessageFilterChanged={this.handleMessageFilterChange}
              assignmentsFilter={this.state.assignmentsFilter}
            />
            <br/>
            <IncomingMessageActions
              people={this.props.organization.organization.people}
              onReassignRequested={this.handleReassignRequested}
            />
            <br/>
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

const mapQueriesToProps = ({ ownProps }) => ({
  organization: {
    query: gql`
      query Q($organizationId: String!) {
        organization(id: $organizationId) {
          id
          people{
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
  reassignCampaignContacts: (organizationId, campaignIdsContactIds, newTexterUserId) => ({
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
