import React, { Component } from 'react'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import IncomingMessageFilter from '../components/IncomingMessageFilter'
import IncomingMessageActions from '../components/IncomingMessageActions'
import IncomingMessageList from '../components/IncomingMessageList.jsx'

export class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)
    this.state = { contactsFilter: {}, campaignsFilter: {} }
  }

  render() {
    return (
      <div>
        <h3> Message Review </h3>
        {console.log(this.props)}
        {console.log(this.props.organization)}
        {console.log(this.props.organization.campaigns)}
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
        />
        <IncomingMessageList
          organizationId={this.props.params.organizationId}
          contactsFilter={this.state.contactsFilter}
          campaignsFilter={this.state.campaignsFilter}
        />
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

export default loadData(withRouter(AdminIncomingMessageList), { mapQueriesToProps })
