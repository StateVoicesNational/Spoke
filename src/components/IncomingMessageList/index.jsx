import React, { Component } from 'react'
import type from 'prop-types'
import FlatButton from 'material-ui/FlatButton'
import ActionOpenInNew from 'material-ui/svg-icons/action/open-in-new'
import loadData from '../../containers/hoc/load-data'
import { withRouter } from 'react-router'
import gql from 'graphql-tag'
import LoadingIndicator from '../../components/LoadingIndicator'
import DataTables from 'material-ui-datatables'
import ConversationPreviewModal from './ConversationPreviewModal';

import { MESSAGE_STATUSES } from '../../components/IncomingMessageFilter'

const prepareDataTableData = (conversations) => conversations.map(conversation => ({
  campaignTitle: conversation.campaign.title,
  texter: conversation.texter.displayName,
  to: conversation.contact.firstName + ' ' + conversation.contact.lastName + (conversation.contact.optOut.cell ? '⛔️' : ''),
  status: conversation.contact.messageStatus,
  messages: conversation.contact.messages
})
)

const prepareSelectedRowsData = (conversations, rowsSelected) => {
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

    this.state = {
      selectedRows: [],
      activeConversation: undefined
    }
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.clearSelectedMessages && this.state.selectedRows.length > 0) {
      this.setState(
        {
          selectedRows: []
        })
      this.props.onConversationSelected([], [])
    }

    let previousPageInfo = { total: 0 }
    if (prevProps.conversations.conversations) {
      previousPageInfo = prevProps.conversations.conversations.pageInfo
    }

    let pageInfo = { total: 0 }
    if (this.props.conversations.conversations) {
      pageInfo = this.props.conversations.conversations.pageInfo
    }

    if (previousPageInfo.total !== pageInfo.total || (!previousPageInfo && pageInfo)) {
      this.props.onConversationCountChanged(pageInfo.total)
    }
  }

  prepareTableColumns = () => [
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

  handleNextPageClick = () => {
    const { limit, offset, total } = this.props.conversations.conversations.pageInfo
    const currentPage = Math.floor(offset / limit)
    const maxPage = Math.floor(total / limit)
    const newPage = Math.min(maxPage, currentPage + 1)
    this.props.onPageChanged(newPage)
  }

  handlePreviousPageClick = () => {
    const { limit, offset } = this.props.conversations.conversations.pageInfo
    const currentPage = Math.floor(offset / limit)
    const newPage = Math.max(0, currentPage - 1)
    this.props.onPageChanged(newPage)
  }

  handleRowSizeChanged = (index, value) => {
    this.props.onPageSizeChanged(value)
  }

  handleRowsSelected = (rowsSelected) => {
    this.setState({ selectedRows: rowsSelected })
    const conversations = this.props.conversations.conversations.conversations
    const selectedConversations = prepareSelectedRowsData(conversations, rowsSelected)
    this.props.onConversationSelected(rowsSelected, selectedConversations)
  }

  handleOpenConversation = (contact) => {
    this.setState({ activeConversation: contact })
  }

  handleCloseConversation = () => {
    this.setState({ activeConversation: undefined })
  }

  render() {
    if (this.props.conversations.loading) {
      return <LoadingIndicator />
    }

    const { conversations, pageInfo } = this.props.conversations.conversations
    const { limit, offset, total } = pageInfo
    const { clearSelectedMessages } = this.props
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
          selectedRows={clearSelectedMessages ? null : this.state.selectedRows}
        />
        <ConversationPreviewModal
          conversation={this.state.activeConversation}
          onRequestClose={this.handleCloseConversation}
        />
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
  onConversationCountChanged: type.func,
  utc: type.string,
  conversations: type.object,
  clearSelectedMessages: type.bool
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
              assignmentId
              firstName
              lastName
              cell
              messageStatus
              messages {
                id
                text
                isFromContact
              }
              optOut {
                cell
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
