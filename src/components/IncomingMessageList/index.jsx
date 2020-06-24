import React, { Component } from "react";
import type from "prop-types";
import FlatButton from "material-ui/FlatButton";
import ActionOpenInNew from "material-ui/svg-icons/action/open-in-new";
import loadData from "../../containers/hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { getHighestRole } from "../../lib/permissions";
import LoadingIndicator from "../../components/LoadingIndicator";
import DataTables from "material-ui-datatables";
import ConversationPreviewModal from "./ConversationPreviewModal";
import TagChip from "../TagChip";
import moment from "moment";

import { MESSAGE_STATUSES } from "../../components/IncomingMessageFilter";

export const prepareDataTableData = conversations =>
  conversations.map(conversation => ({
    campaignTitle: conversation.campaign.title,
    texter:
      conversation.texter.displayName +
      (getHighestRole(conversation.texter.roles) === "SUSPENDED"
        ? " (Suspended)"
        : ""),
    to:
      conversation.contact.firstName +
      " " +
      conversation.contact.lastName +
      // \u26d4 is the No Entry symbol: http://unicode.org/cldr/utility/character.jsp?a=26D4
      // including it directly breaks some text editors
      (conversation.contact.optOut ? "\u26d4" : ""),
    cell: conversation.contact.cell,
    campaignContactId: conversation.contact.id,
    assignmentId: conversation.contact.assignmentId,
    status: conversation.contact.messageStatus,
    messages: conversation.contact.messages,
    tags: conversation.contact.tags
  }));

const prepareSelectedRowsData = (conversations, rowsSelected) => {
  let selection = rowsSelected;
  if (rowsSelected === "all") {
    selection = Array.from(Array(conversations.length).keys());
  } else if (rowsSelected === "none") {
    selection = [];
  }

  return selection.map(selectedIndex => {
    const conversation = conversations[selectedIndex];
    return {
      campaignId: conversation.campaign.id,
      campaignContactId: conversation.contact.id,
      messageIds: conversation.contact.messages.map(message => message.id)
    };
  });
};

export class IncomingMessageList extends Component {
  constructor(props) {
    super(props);

    const tags = {};
    (props.tags || []).forEach(tag => {
      tags[tag.id] = tag.name;
    });

    this.state = {
      selectedRows: [],
      activeConversation: undefined,
      tags
    };
  }

  componentDidMount() {
    let conversationCount = 0;
    if (this.props.conversations.conversations) {
      conversationCount = this.props.conversations.conversations.pageInfo.total;
    }
    this.props.onConversationCountChanged(conversationCount);
  }

  componentDidUpdate = prevProps => {
    if (
      this.props.clearSelectedMessages &&
      this.state.selectedRows.length > 0
    ) {
      this.setState({
        selectedRows: []
      });
      this.props.onConversationSelected([], []);
    }

    let previousPageInfo = { total: 0 };
    if (prevProps.conversations.conversations) {
      previousPageInfo = prevProps.conversations.conversations.pageInfo;
    }

    let pageInfo = { total: 0 };
    if (this.props.conversations.conversations) {
      pageInfo = this.props.conversations.conversations.pageInfo;
    }

    if (
      previousPageInfo.total !== pageInfo.total ||
      (!previousPageInfo && pageInfo)
    ) {
      this.props.onConversationCountChanged(pageInfo.total);
    }
  };

  prepareTableColumns = () => [
    {
      key: "campaignTitle",
      label: "Campaign",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "texter",
      label: "Texter",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "to",
      label: "To",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "status",
      label: "Conversation Status",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) => MESSAGE_STATUSES[row.status].name
    },
    {
      key: "latestMessage",
      label: "Latest Message",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) => {
        let lastMessage = null;
        let lastMessageEl = <p>No Messages</p>;
        if (row.messages && row.messages.length > 0) {
          lastMessage = row.messages[row.messages.length - 1];
          lastMessageEl = (
            <p
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap"
              }}
              title={lastMessage.text}
            >
              <span
                style={{ color: lastMessage.isFromContact ? "blue" : "black" }}
              >
                <b>{lastMessage.isFromContact ? "Contact:" : "Texter:"} </b>
              </span>
              {lastMessage.text}
              <br />
              <span style={{ color: "gray", fontSize: "85%" }}>
                {moment.utc(lastMessage.createdAt).fromNow()}
              </span>
            </p>
          );
        }
        return lastMessageEl;
      }
    },
    {
      key: "viewConversation",
      label: "View Conversation",
      style: {
        textOverflow: "ellipsis",
        overflow: "scroll",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) =>
        row.messages &&
        row.messages.length > 1 && (
          <div>
            <FlatButton
              onClick={event => {
                event.stopPropagation();
                this.handleOpenConversation(row);
              }}
              icon={<ActionOpenInNew />}
            />
            {window.EXPERIMENTAL_TAGS && this.renderTags(row.tags)}
          </div>
        )
    }
  ];

  handleNextPageClick = () => {
    const {
      limit,
      offset,
      total
    } = this.props.conversations.conversations.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const maxPage = Math.floor(total / limit);
    const newPage = Math.min(maxPage, currentPage + 1);
    this.props.onPageChanged(newPage);
  };

  handlePreviousPageClick = () => {
    const { limit, offset } = this.props.conversations.conversations.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const newPage = Math.max(0, currentPage - 1);
    this.props.onPageChanged(newPage);
  };

  handleRowSizeChanged = (index, value) => {
    this.props.onPageSizeChanged(value);
  };

  handleRowsSelected = rowsSelected => {
    this.setState({ selectedRows: rowsSelected });
    const conversations = this.props.conversations.conversations.conversations;
    const selectedConversations = prepareSelectedRowsData(
      conversations,
      rowsSelected
    );
    this.props.onConversationSelected(rowsSelected, selectedConversations);
  };

  handleOpenConversation = contact => {
    this.setState({ activeConversation: contact });
  };

  handleCloseConversation = () => {
    this.setState({ activeConversation: undefined });
  };

  renderTags = tags => {
    // dedupe names from server
    const tagNames = {};
    tags &&
      tags
        .filter(tag => !tag.resolvedAt)
        .forEach(tag => {
          tagNames[this.state.tags[tag.id]] = 1;
        });
    console.log("tagnames", tagNames);
    return (
      <div>
        {Object.keys(tagNames).map(name => (
          <TagChip text={name} />
        ))}
      </div>
    );
  };

  render() {
    if (this.props.conversations.loading) {
      return <LoadingIndicator />;
    }

    const { conversations, pageInfo } = this.props.conversations.conversations;
    const { limit, offset, total } = pageInfo;
    const { clearSelectedMessages } = this.props;
    const displayPage = Math.floor(offset / limit) + 1;
    const tableData = prepareDataTableData(conversations);

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
          {...(window.EXPERIMENTAL_TAGS && {
            organizationTags: this.state.tags
          })}
          conversation={this.state.activeConversation}
          onRequestClose={this.handleCloseConversation}
          onForceRefresh={this.props.onForceRefresh}
          organizationId={this.props.organizationId}
        />
      </div>
    );
  }
}

IncomingMessageList.propTypes = {
  organizationId: type.string,
  cursor: type.object,
  contactsFilter: type.object,
  campaignsFilter: type.object,
  assignmentsFilter: type.object,
  messageTextFilter: type.string,
  onPageChanged: type.func,
  onPageSizeChanged: type.func,
  onConversationSelected: type.func,
  onConversationCountChanged: type.func,
  utc: type.string,
  conversations: type.object,
  clearSelectedMessages: type.bool,
  onForceRefresh: type.func,
  tags: type.arrayOf(type.object)
};

const queries = {
  conversations: {
    query: gql`
      query Q(
        $organizationId: String!
        $cursor: OffsetLimitCursor!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $messageTextFilter: String
        $utc: String
      ) {
        conversations(
          cursor: $cursor
          organizationId: $organizationId
          campaignsFilter: $campaignsFilter
          contactsFilter: $contactsFilter
          assignmentsFilter: $assignmentsFilter
          messageTextFilter: $messageTextFilter
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
              roles(organizationId: $organizationId)
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
                createdAt
              }
              tags {
                id
              }
              optOut {
                id
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.organizationId,
        cursor: ownProps.cursor,
        contactsFilter: ownProps.contactsFilter,
        campaignsFilter: ownProps.campaignsFilter,
        assignmentsFilter: ownProps.assignmentsFilter,
        messageTextFilter: ownProps.messageTextFilter,
        utc: ownProps.utc
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(withRouter(IncomingMessageList));
