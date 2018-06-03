import React, { Component } from 'react'
import type from 'prop-types'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from 'material-ui/Table'
import loadData from '../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../components/LoadingIndicator'

function getMessagesFromOrganization(organization) {
  const messages = []
  for (const campaign of organization.campaigns) {
    for (const assignment of campaign.assignments) {
      for (const contact of assignment.contacts) {
        for (const message of contact.messages) {
          if (message.isFromContact) {
            messages.push(message)
          }
        }
      }
    }
  }
  return messages
}

export class IncomingMessageList extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        {this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderColumn> Date Sent: </TableHeaderColumn>
                <TableHeaderColumn> From: </TableHeaderColumn>
                <TableHeaderColumn> To: </TableHeaderColumn>
                <TableHeaderColumn style={{ width: '40%' }}> Message Body </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getMessagesFromOrganization(this.props.organization.organization).map(message => (
                <TableRow key={message.id}>
                  <TableRowColumn> {message.createdAt}</TableRowColumn>
                  <TableRowColumn>{message.userNumber}</TableRowColumn>
                  <TableRowColumn>{message.contactNumber}</TableRowColumn>
                  <TableRowColumn style={{ width: '40%' }}>{message.text}</TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    )
  }
}

IncomingMessageList.propTypes = {
  messages: type.array,
  organizationId: type.string,
  contactsFilter: type.object,
  onCampaignChanged: type.func,
  campaigns: type.array,
  messages_filter: type.object
}

const mapQueriesToProps = ({ ownProps }) => ({
  organization: {
    query: gql`
      query Q(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
      ) {
        organization(id: $organizationId) {
          id
          campaigns(campaignsFilter: $campaignsFilter) {
            id
            title
            assignments {
              contacts(contactsFilter: $contactsFilter) {
                id
                cell
                messageStatus
                messages {
                  id
                  createdAt
                  userNumber
                  contactNumber
                  text
                  isFromContact
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      contactsFilter: ownProps.contactsFilter,
      campaignsFilter: ownProps.campaignsFilter
    },
    forceFetch: true
  }
})

export default loadData(withRouter(IncomingMessageList), { mapQueriesToProps })
