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
import { Card, CardHeader, CardText } from 'material-ui/Card'
import loadData from '../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../components/LoadingIndicator'

function getAssignmentsFromOrganization(organization) {
  const assignments = []
  for (const campaign of organization.campaigns) {
    for (const assignment of campaign.assignments) {
      assignments.push(assignment)
    }
  }
  return assignments
}

function prepareTableData(organization) {
  const assignments = getAssignmentsFromOrganization(organization)
  const tableData = []
  for (const assignment of assignments) {
    for (const contact of assignment.contacts) {
      tableData.push({
        campaignId: assignment.campaign.id,
        campaignContactId: contact.id
      })
    }
  }
  return tableData
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
          <div>
            <Table
              multiSelectable
              onRowSelection={(rowsSelected) => {
                if (
                  this.props.onConversationSelected != null &&
                  typeof this.props.onConversationSelected === 'function'
                ) {
                  this.props.onConversationSelected(
                    rowsSelected,
                    prepareTableData(this.props.organization.organization)
                  )
                }
              }}
            >
              <TableHeader enableSelectAll>
                <TableRow>
                  <TableHeaderColumn> Texter </TableHeaderColumn>
                  <TableHeaderColumn> To </TableHeaderColumn>
                  <TableHeaderColumn> Conversation Status </TableHeaderColumn>
                  <TableHeaderColumn style={{ width: '40%' }}> Messages </TableHeaderColumn>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getAssignmentsFromOrganization(this.props.organization.organization).map(
                  assignment => {
                    return assignment.contacts.map(contact => (
                      <TableRow key={contact.id} value={[assignment.campaign.id, contact.id]}>
                        <TableRowColumn> {assignment.texter.displayName} </TableRowColumn>
                        <TableRowColumn> {contact.cell} </TableRowColumn>
                        <TableRowColumn> {contact.messageStatus} </TableRowColumn>
                        <TableRowColumn style={{ width: '40%' }}>
                          <Card>
                            <CardHeader title={'Messages'} actAsExpander showExpandableButton />
                            <CardText expandable>
                              <div>
                                {contact.messages.map(message => (
                                  <p
                                    style={
                                      message.isFromContact ? { color: 'red' } : { color: 'black' }
                                    }
                                  >
                                    {message.text}
                                  </p>
                                ))}
                              </div>
                            </CardText>
                          </Card>
                        </TableRowColumn>
                      </TableRow>
                    ))
                  }
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }
}

IncomingMessageList.propTypes = {
  organizationId: type.string,
  contactsFilter: type.object,
  campaignsFilter: type.object,
  onConversationSelected: type.func,
  utc: type.number
}

const mapQueriesToProps = ({ ownProps }) => ({
  organization: {
    query: gql`
      query Q(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $utc: String
      ) {
        organization(id: $organizationId, utc:$utc) {
          id
          campaigns(campaignsFilter: $campaignsFilter) {
            id
            title
            assignments {
              campaign {
                id
              }
              texter {
                id
                displayName
              }
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
      campaignsFilter: ownProps.campaignsFilter,
      utc: ownProps.utc
    },
    forceFetch: true
  }
})

export default loadData(withRouter(IncomingMessageList), { mapQueriesToProps })
