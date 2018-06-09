import React, { Component } from 'react'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import IncomingMessageFilter from '../components/IncomingMessageFilter'
import IncomingMessageActions from '../components/IncomingMessageActions'
import IncomingMessageList from '../components/IncomingMessageList.jsx'
import LoadingIndicator from '../components/LoadingIndicator'
import wrapMutations from './hoc/wrap-mutations'

export class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)
    this.state = { contactsFilter: {}, campaignsFilter: {}, needsRender: false, utc:Date.now().toString() }
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

  render() {
    return (
      <div>
        <h3> Message Review </h3>
        {this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <div>
            <IncomingMessageFilter
              campaigns={this.props.organization.organization.campaigns}
              onCampaignChanged={async campaignId => {
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
                  campaignsFilter
                })
              }}
              onMessageFilterChanged={async messagesFilter => {
                await this.setState({
                  contactsFilter: { messageStatus: messagesFilter }
                })
              }}
            />
            <IncomingMessageActions
              people={this.props.organization.organization.people}
              onReassignRequested={async newTexterUserId => {
                await this.props.mutations.reassignCampaignContacts(
                  this.props.params.organizationId,
                  this.state.campaignIdsContactIds,
                  newTexterUserId
                )
                this.setState({needsRender: true, utc:Date.now().toString()})

              }}
            />
            <IncomingMessageList
              organizationId={this.props.params.organizationId}
              contactsFilter={this.state.contactsFilter}
              campaignsFilter={this.state.campaignsFilter}
              utc={this.state.utc}
              onConversationSelected={(selectedRows, data) => {
                if (this.state.previousSelectedRows === 'all' && selectedRows !== 'all') {
                  this.setState({
                    previousSelectedRows: [],
                    campaignIdsContactIds: [],
                    needsRender: false
                  })
                } else {
                  let campaignIdsContactIds = null
                  if (selectedRows === 'all') {
                    campaignIdsContactIds = data
                  } else {
                    campaignIdsContactIds = selectedRows.map(rowIndex => {
                      return data[rowIndex]
                    })
                  }
                  this.setState({
                    previousSelectedRows: selectedRows,
                    campaignIdsContactIds,
                    needsRender: false
                  })
                }
              }}
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
            assignments {
              texter {
                id
                displayName
              }
            }
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
  } )
})

export default loadData(withRouter(wrapMutations(AdminIncomingMessageList)), {
  mapQueriesToProps,
  mapMutationsToProps
})
