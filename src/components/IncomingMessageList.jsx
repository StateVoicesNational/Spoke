import React, { Component } from 'react'
import type from 'prop-types'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ActionOpenInNew from 'material-ui/svg-icons/action/open-in-new'
import loadData from '../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../components/LoadingIndicator'
import DataTables from 'material-ui-datatables'

import { MESSAGE_STATUSES } from '../components/IncomingMessageFilter'

function prepareDataTableData(conversations) {
  const tableData = conversations.conversations.map(conversation => {
    return {
      campaignTitle: conversation.campaign.title,
      texter: conversation.texter.displayName,
      to: conversation.contact.firstName + ' ' + conversation.contact.lastName,
      status: conversation.contact.messageStatus,
      messages: conversation.contact.messages
    }
  })
  return tableData
}

function prepareSelectedRowsData(conversations, rowsSelected) {
  let thingToIterate = []
  if (rowsSelected === 'all') {
    thingToIterate = []
    for (let i = 0; i < conversations.length; i++) {
      thingToIterate.push(i)
    }
  } else if (rowsSelected !== 'none') {
    thingToIterate = rowsSelected
  }

  return thingToIterate.reduce((returnData, index) => {
    const conversation = conversations[index]
    returnData.push({
      campaignId: conversation.campaign.id,
      campaignContactId: conversation.contact.id,
      messageIds: conversation.contact.messages.map(message => {
        return message.id
      })
    })
    return returnData
  }, [])
}

export class IncomingMessageList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      page: 1,
      rowSize: 10,
      activeConversation: undefined
    }

    this.prepareTableColumns = this.prepareTableColumns.bind(this)
    this.handleNextPageClick = this.handleNextPageClick.bind(this)
    this.handlePreviousPageClick = this.handlePreviousPageClick.bind(this)
    this.handleRowSizeChanged = this.handleRowSizeChanged.bind(this)

    this.handleOpenConversation = this.handleOpenConversation.bind(this)
    this.handleCloseConversation = this.handleCloseConversation.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.conversations.loading) {
      this.setState({ data: [], count: 0, page: 1 })
    } else {
      const assignments = prepareDataTableData(nextProps.conversations.conversations)
      this.setState({ data: assignments, count: assignments.length, page: 1 })
    }
  }

  prepareTableColumns() {
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
        label: 'Conversation Status',
        render: (columnKey, row) => MESSAGE_STATUSES[row.status].name
      },
      {
        key: 'latestMessage',
        label: 'Latest Message',
        render: (columnKey, row) => {
          let lastMessage = null
          let lastMessageEl = <p>No Messages</p>
          if (row.messages && row.messages.length > 0) {
            lastMessage = row.messages[row.messages.length - 1]
            lastMessageEl = (
              <p>
                <span style={{ color: lastMessage.isFromContact ? 'blue' : 'black' }}>
                  <b>{lastMessage.isFromContact ? 'Contact:' : 'Texter:'} </b>
                </span>
                {lastMessage.text}
              </p>
            )
          }
          return lastMessageEl
        }
      },
      {
        key: 'viewConversation',
        label: 'View Conversation',
        render: (columnKey, row) => {
          if (row.messages && row.messages.length > 0) {
            return (
              <FlatButton
                onClick={event => {
                  event.stopPropagation()
                  this.handleOpenConversation(row)
                }}
                icon={<ActionOpenInNew />}
              />
            )
          }
          return ''
        }
      }
    ]
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

  handleOpenConversation(contact) {
    this.setState({ activeConversation: contact })
  }

  handleCloseConversation() {
    this.setState({ activeConversation: undefined })
  }

  render() {
    const sliceStart = (this.state.page - 1) * this.state.rowSize,
      sliceEnd = (this.state.page - 1) * this.state.rowSize + this.state.rowSize
    const tableData = this.state.data.slice(sliceStart, sliceEnd)
    return (
      <div>
        {this.props.conversations.loading ? (
          <LoadingIndicator />
        ) : (
          <DataTables
            data={tableData}
            columns={this.prepareTableColumns()}
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
                  prepareSelectedRowsData(this.props.conversations.conversations, rowsSelected)
                )
              }
            }}
          />
        )}
        <Dialog
          title="Messages"
          open={this.state.activeConversation !== undefined}
          modal={false}
          autoScrollBodyContent={true}
          onRequestClose={this.handleCloseConversation}
        >
          {this.state.activeConversation !== undefined && (
            <div>
              {this.state.activeConversation.messages.map((message, index) => {
                const isFromContact = message.isFromContact
                const style = {
                  color: isFromContact ? 'blue' : 'black',
                  textAlign: isFromContact ? 'left' : 'right'
                }

                return (
                  <p key={index} style={style}>
                    {message.text}
                  </p>
                )
              })}
            </div>
          )}
        </Dialog>
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
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $utc: String
      ) {
        conversations(
          organizationId: $organizationId
          campaignsFilter: $campaignsFilter
          contactsFilter: $contactsFilter
          utc: $utc
        ) {
          conversations {
            texter {
              id
              displayName
            }
            contact {
              id
              firstName
              lastName
              messageStatus
              messages {
                id
                text
                isFromContact
              }
            }
            campaign {
              id
              title
            }
            assignment {
              id
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
