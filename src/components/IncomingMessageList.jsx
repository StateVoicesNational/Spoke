import React, { Component } from 'react'
import type from 'prop-types'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import loadData from '../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../components/LoadingIndicator'
import DataTables from 'material-ui-datatables'

function prepareDataTableData(organization) {
  const assignments = getAssignmentsFromOrganization(organization)
  const tableData = []
  for (const assignment of assignments) {
    for (const contact of assignment.contacts) {
      tableData.push({
        campaignTitle: assignment.campaign.title,
        texter: assignment.texter.displayName,
        to: contact.firstName + ' ' + contact.lastName,
        status: contact.messageStatus,
        messages: contact.messages
      })
    }
  }
  return tableData
}

function prepareTableColumns() {
  return [
    {
      key: 'campaignTitle',
      label: 'Campaign'
    },
    {
      key: 'texter',
      label: 'Texter'
    },
    {
      key: 'to',
      label: 'To'
    },
    {
      key: 'status',
      label: 'Conversation Status'
    },
    {
      key: 'messages',
      label: 'Messages',
      //style: {
      //  width: '30%'
      //},
      render: (columnKey, row) => {
        return (
          <Card onClick={(event) => event.stopPropagation()}>
            <CardHeader title={'Messages'} actAsExpander={true} showExpandableButton={true} />
            <CardText expandable={true}>
              <div>
                {row.messages.map((message, index) => {
                  const style = message.isFromContact ?
                      {'color': 'blue', 'textAlign': 'left'} :
                      {'color': 'black', 'textAlign': 'right'};
                  return (
                    <p key={index} style={style}>
                      {message.text}
                    </p>
                  );
                })}
              </div>
            </CardText>
          </Card>
        )
      }
    }
  ]
}

function getAssignmentsFromOrganization(organization) {
  const assignments = []
  for (const campaign of organization.campaigns) {
    for (const assignment of campaign.assignments) {
      assignments.push(assignment)
    }
  }
  return assignments
}

function getContactsFromOrganization(organization) {
  const assignments = getAssignmentsFromOrganization(organization)
  return assignments.reduce((accumulator, assignment) => {
    if (!assignment.contacts) {
      return accumulator
    }
    return assignment.contacts.reduce((contactAccumulator, contact) => {
      contactAccumulator.push(contact)
      return contactAccumulator
    }, accumulator)
  }, [])
}

function prepareSelectedRowsData(organization, rowsSelected) {
  const contacts = getContactsFromOrganization(organization)
  let thingToIterate = []
  if (rowsSelected === 'all') {
    thingToIterate = []
    for (let i = 0; i < contacts.length; i++) {
      thingToIterate.push(i)
    }
  } else if (rowsSelected !== 'none') {
    thingToIterate = rowsSelected
  }

  return thingToIterate.reduce((returnData, index) => {
    const contact = contacts[index]
    returnData.push({
      campaignId: contact.campaign.id,
      campaignContactId: contact.id,
      messageIds: contact.messages.map(message => {
        return message.id
      })
    })
    return returnData
  }, [])
}

export class IncomingMessageList extends Component {
  constructor(props) {
    super(props)
    this.state = { data: [], page: 1, rowSize: 10 }

    this.handleNextPageClick = this.handleNextPageClick.bind(this)
    this.handlePreviousPageClick = this.handlePreviousPageClick.bind(this)
    this.handleRowSizeChanged = this.handleRowSizeChanged.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.organization.loading) {
      this.setState({ data: [], count: 0, page: 1 })
    } else {
      const assignments = prepareDataTableData(nextProps.organization.organization)
      this.setState({ data: assignments, count: assignments.length, page: 1 })
    }
  }

  handleNextPageClick() {
    this.setState({
      page: this.state.page + 1
    })
  }

  handlePreviousPageClick() {
    this.setState({
      page: this.state.page - 1
    })
  }

  handleRowSizeChanged(index, value) {
    this.setState({ rowSize: value })
  }

  render() {
    const sliceStart = (this.state.page - 1) * this.state.rowSize,
          sliceEnd = (this.state.page - 1) * this.state.rowSize + this.state.rowSize;
    const tableData = this.state.data.slice(sliceStart, sliceEnd);
    return (
      <div>
        {this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <DataTables
            data={tableData}
            columns={prepareTableColumns()}
            multiSelectable
            selectable
            enableSelectAll
            showCheckboxes
            page={this.state.page}
            rowSize={this.state.rowSize}
            count={this.state.count}
            onNextPageClick={this.handleNextPageClick}
            onPreviousPageClick={this.handlePreviousPageClick}
            onRowSizeChange={this.handleRowSizeChanged}
            onRowSelection={rowsSelected => {
              if (
                this.props.onConversationSelected != null &&
                typeof this.props.onConversationSelected === 'function'
              ) {
                this.props.onConversationSelected(
                  rowsSelected,
                  prepareSelectedRowsData(this.props.organization.organization, rowsSelected)
                )
              }
            }}
          />
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
  utc: type.string
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
        organization(id: $organizationId, utc: $utc) {
          id
          campaigns(campaignsFilter: $campaignsFilter) {
            id
            title
            assignments {
              campaign {
                id
                title
              }
              texter {
                id
                displayName
              }
              contacts(contactsFilter: $contactsFilter) {
                id
                campaign {
                  id
                }
                firstName
                lastName
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
