import React, { Component } from 'react'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import IncomingMessageFilter from '../components/IncomingMessageFilter'
import IncomingMessageList from '../components/IncomingMessageList.jsx'

export class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)
    this.state = { contactsFilter: {}, campaignsFilter: {} }
  }

  render() {
    return (
      <div>
        <h3> All Incoming Messages </h3>
        {console.log(this.props)}
        {console.log(this.props.organization)}
        {console.log(this.props.organization.campaigns)}
        <IncomingMessageFilter
          campaigns={this.props.organization.organization.campaigns}
          onCampaignChanged={async campaignId => {
            await this.setState({
              campaignsFilter: { campaignId: campaignId }
            })
          }}
          onMessageFilterChanged={async messagesFilter => {
            await this.setState({
              contactsFilter: { messageStatus: messagesFilter }
            })
          }}
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

export default loadData(withRouter(AdminIncomingMessageList), { mapQueriesToProps })
