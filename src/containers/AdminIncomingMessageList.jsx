import React, { Component } from 'react'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import IncomingMessageFilter from '../components/IncomingMessageFilter'
import IncomingMessageActions from '../components/IncomingMessageActions'
import IncomingMessageList from '../components/IncomingMessageList'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'

export class AdminIncomingMessageList extends Component {

  constructor(props) {
    super(props)

    this.state = {
      page: 0,
      pageSize: 10,
      contactsFilter: {},
      campaignsFilter: {},
      assignmentsFilter: {},
      needsRender: false,
      utc: Date.now().toString()
    }

    this.handleCampaignChange = this.handleCampaignChange.bind(this)
    this.handleMessageFilterChange = this.handleMessageFilterChange.bind(this)
    this.handleReassignRequested = this.handleReassignRequested.bind(this)
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handlePageSizeChange = this.handlePageSizeChange.bind(this)
    this.handleRowSelection = this.handleRowSelection.bind(this)
  }

  shouldComponentUpdate(_, nextState) {
    if (
      !nextState.needsRender &&
      nextState.contactsFilter === this.state.contactsFilter &&
      nextState.campaignsFilter === this.state.campaignsFilter
    ) {
      return false
    }
    return true
  }

  async handleCampaignChange(campaignId) {
    let campaignsFilter = {}
    switch (campaignId) {
      case -1:
        break
      case -2:
        campaignsFilter = { isArchived: false }
        break
      case -3:
        campaignsFilter = { isArchived: true }
        break
      default:
        campaignsFilter = { campaignId }
    }
    await this.setState({
      campaignsFilter,
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

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    }
    return (
      <div>
        <h3> Message Review </h3>
        {this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <div>
            <IncomingMessageFilter
              campaigns={this.props.organization.organization.campaigns}
              onCampaignChanged={this.handleCampaignChange}
              onMessageFilterChanged={this.handleMessageFilterChange}
            />
            <br />
            <IncomingMessageActions
              people={this.props.organization.organization.people}
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
          campaigns {
            id
            title
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
