import React, { Component } from 'react'
import type from 'prop-types'
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
  const tableData = conversations.map(conversation => {
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
  let selection = rowsSelected
  if (rowsSelected === 'all') {
    selection = Array.from(Array(conversations.length).keys())
  } else if (rowsSelected === 'none') {
    selection = []
  }

  return selection.map(selectedIndex => {
    const conversation = conversations[selectedIndex]
    return {
      campaignId: conversation.campaign.id,
      campaignContactId: conversation.contact.id,
      messageIds: conversation.contact.messages.map(message => message.id)
    }
  })
}

export class IncomingMessageList extends Component {
  constructor(props) {
    super(props)

    this.state = { activeConversation: undefined }

    this.prepareTableColumns = this.prepareTableColumns.bind(this)
    this.handleNextPageClick = this.handleNextPageClick.bind(this)
    this.handlePreviousPageClick = this.handlePreviousPageClick.bind(this)
    this.handleRowSizeChanged = this.handleRowSizeChanged.bind(this)
    this.handleRowsSelected = this.handleRowsSelected.bind(this)

    this.handleOpenConversation = this.handleOpenConversation.bind(this)
    this.handleCloseConversation = this.handleCloseConversation.bind(this)
  }

  prepareTableColumns() {
    return [
      {
        key: 'campaignTitle',
        label: 'Campaign',
        style: {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'pre-line'
        }
      },
      {
        key: 'texter',
        label: 'Texter',
        style: {
          textOverflow: 'ellipsis',
          overflow: 'scroll',
          whiteSpace: 'pre-line'
        }
      },
      {
        key: 'to',
        label: 'To',
        style: {
          textOverflow: 'ellipsis',
          overflow: 'scroll',
          whiteSpace: 'pre-line'
        }
      },
      {
        key: 'status',
        label: 'Conversation Status',
        style: {
          textOverflow: 'ellipsis',
          overflow: 'scroll',
          whiteSpace: 'pre-line'
        },
        render: (columnKey, row) => MESSAGE_STATUSES[row.status].name
      },
      {
        key: 'latestMessage',
        label: 'Latest Message',
        style: {
          textOverflow: 'ellipsis',
          overflow: 'scroll',
          whiteSpace: 'pre-line'
        },
        render: (columnKey, row) => {
          let lastMessage = null
          let lastMessageEl = <p>No Messages</p>
          if (row.messages && row.messages.length > 0) {
            lastMessage = row.messages[row.messages.length - 1]
            lastMessageEl = (
              <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
        style: {
          textOverflow: 'ellipsis',
          overflow: 'scroll',
          whiteSpace: 'pre-line'
        },
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
    const { limit, offset, total } = this.props.conversations.conversations.pageInfo
    const currentPage = Math.floor(offset / limit)
    const maxPage = Math.floor(total / limit)
    const newPage = Math.min(maxPage, currentPage + 1)
    this.props.onPageChanged(newPage)
  }

  handlePreviousPageClick() {
    const { limit, offset } = this.props.conversations.conversations.pageInfo
    const currentPage = Math.floor(offset / limit)
    const newPage = Math.max(0, currentPage - 1)
    this.props.onPageChanged(newPage)
  }

  handleRowSizeChanged(index, value) {
    this.props.onPageSizeChanged(value)
  }

  handleRowsSelected(rowsSelected) {
    const conversations = this.props.conversations.conversations.conversations
    const selectedConversations = prepareSelectedRowsData(conversations, rowsSelected)
    this.props.onConversationSelected(rowsSelected, selectedConversations)
  }

  handleOpenConversation(contact) {
    this.setState({ activeConversation: contact })
  }

  handleCloseConversation() {
    this.setState({ activeConversation: undefined })
  }

  render() {
    if (this.props.conversations.loading) {
      return <LoadingIndicator />
    }

    const { conversations, pageInfo } = this.props.conversations.conversations
    const { limit, offset, total } = pageInfo
    const displayPage = Math.floor(offset / limit) + 1
    const tableData = prepareDataTableData(conversations)
    return (
      <div>
        <DataTables
          data={tableData}
          columns={this.prepareTableColumns()}
          multiSelectable
          selectable
          enableSelectAll
          showCheckboxes
          page={displayPage}
          rowSize={limit}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
          onRowSelection={this.handleRowsSelected}
        />
        <Dialog
          title='Messages'
          open={this.state.activeConversation !== undefined}
          modal={false}
          autoScrollBodyContent
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
  cursor: type.object,
  contactsFilter: type.object,
  campaignsFilter: type.object,
  assignmentsFilter: type.object,
  onPageChanged: type.func,
  onPageSizeChanged: type.func,
  onConversationSelected: type.func,
  utc: type.string
}

const mapQueriesToProps = ({ ownProps }) => ({
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $cursor: OffsetLimitCursor!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $utc: String
      ) {
        conversations(
          cursor: $cursor
          organizationId: $organizationId
          campaignsFilter: $campaignsFilter
          contactsFilter: $contactsFilter
          assignmentsFilter: $assignmentsFilter
          utc: $utc
        ) {
          pageInfo {
            limit
            offset
            total
          }
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
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      cursor: ownProps.cursor,
      contactsFilter: ownProps.contactsFilter,
      campaignsFilter: ownProps.campaignsFilter,
      assignmentsFilter: ownProps.assignmentsFilter,
      utc: ownProps.utc
    },
    forceFetch: true
  }
})

export default loadData(withRouter(IncomingMessageList), { mapQueriesToProps })
