import React, { Component } from "react";
import type from "prop-types";
import FlatButton from "material-ui/FlatButton";
import ActionOpenInNew from "material-ui/svg-icons/action/open-in-new";
import loadData from "../../containers/hoc/load-data";
import { Link, withRouter } from "react-router";
import gql from "graphql-tag";
import { getHighestRole } from "../../lib/permissions";
import LoadingIndicator from "../../components/LoadingIndicator";
import DataTables from "material-ui-datatables";
import ConversationPreviewModal from "./ConversationPreviewModal";
import TagChip from "../TagChip";
import moment from "moment";
import theme from "../../styles/theme";
import { StyleSheet, css } from "aphrodite";
import { MESSAGE_STATUSES } from "../../components/IncomingMessageFilter";

const styles = StyleSheet.create({
  link_light_bg: {
    ...theme.text.link_light_bg
  }
});

export const prepareDataTableData = conversations =>
  conversations.map(conversation => ({
    campaignTitle: conversation.campaign.title,
    texter: conversation.texter,
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
    errorCode: conversation.contact.errorCode,
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

  componentWillUpdate = () => {
    this.state.showAllRepliesLink =
      this.props.conversations.conversations.pageInfo.total > 0 &&
      this.props.campaignsFilter.campaignIds &&
      this.props.campaignsFilter.campaignIds.length === 1 &&
      this.props.assignmentsFilter.texterId;
  };
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
        overflow: "hidden",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) => (
        <span>
          {row.texter.id !== null ? (
            <span>
              {row.texter.displayName +
                (getHighestRole(row.texter.roles) === "SUSPENDED"
                  ? " (Suspended)"
                  : "")}{" "}
              <Link
                target="_blank"
                to={`/app/${this.props.organizationId}/todos/other/${row.texter.id}`}
              >
                <ActionOpenInNew
                  style={{
                    width: 14,
                    height: 14,
                    color: theme.colors.coreBackgroundColor
                  }}
                />
              </Link>
            </span>
          ) : (
            "unassigned"
          )}
        </span>
      )
    },
    {
      key: "to",
      label: "To",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      }
    },
    {
      key: "status",
      label: "Conversation Status",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) => (
        <div>
          {MESSAGE_STATUSES[row.status].name}
          {row.errorCode ? (
            <div style={{ color: theme.colors.darkRed }}>
              error: {row.errorCode}
            </div>
          ) : null}
        </div>
      )
    },
    {
      key: "latestMessage",
      label: "Latest Message",
      style: {
        textOverflow: "ellipsis",
        overflow: "hidden",
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
        overflow: "hidden",
        whiteSpace: "pre-line"
      },
      render: (columnKey, row) => (
        <div>
          {row.messages && row.messages.length > 1 && (
            <FlatButton
              onClick={event => {
                event.stopPropagation();
                this.handleOpenConversation(row);
              }}
              icon={<ActionOpenInNew />}
            />
          )}
          {this.renderTags(row.tags, row)}
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

  renderTags = (tags, row) => {
    // dedupe names from server
    const tagNames = {};
    tags &&
      tags
        .filter(tag => !tag.resolvedAt)
        .forEach(tag => {
          tagNames[this.state.tags[tag.id]] = tag;
        });
    return (
      <div>
        {Object.keys(tagNames).map(name => (
          <TagChip
            text={name}
            backgroundColor={
              tagNames[name].value !== "RESOLVED"
                ? null
                : theme.colors.lightGray
            }
            onRequestDelete={
              tagNames[name].value !== "RESOLVED"
                ? async () => {
                    console.log("resolving tag", name, tagNames[name]);
                    const res = await this.props.mutations.updateTag(
                      row.campaignContactId,
                      tagNames[name].id,
                      "RESOLVED"
                    );
                  }
                : null
            }
          />
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
    let firstAssignmentid = null;
    let firstAssignmentTexter = null;
    let firstAssignmentCampaignTitle = null;
    if (tableData.length) {
      firstAssignmentid = tableData[0].assignmentId;
      firstAssignmentTexter = tableData[0].texter.displayName;
      firstAssignmentCampaignTitle = tableData[0].campaignTitle;
    }

    let rowSizeList = [10, 20, 50, 100];

    try {
      rowSizeList = JSON.parse(window.CONVERSATION_LIST_ROW_SIZES);
    } catch (err) {
      console.log(err);
    }

    return (
      <div>
        {this.state.showAllRepliesLink && (
          <div>
            <Link
              className={css(styles.link_light_bg)}
              target="_blank"
              to={`/app/${this.props.organizationId}/todos/${firstAssignmentid}/allreplies?review=1`}
            >
              Sweep {firstAssignmentTexter}'s messages in{" "}
              {firstAssignmentCampaignTitle}
              <ActionOpenInNew
                style={{
                  width: 14,
                  height: 14,
                  color: theme.colors.coreBackgroundColor
                }}
              />
            </Link>
          </div>
        )}
        <DataTables
          data={tableData}
          columns={this.prepareTableColumns()}
          multiSelectable
          selectable
          enableSelectAll
          showCheckboxes
          page={displayPage}
          rowSize={limit}
          rowSizeList={rowSizeList.sort((a, b) => Number(a) - Number(b))}
          count={total}
          onNextPageClick={this.handleNextPageClick}
          onPreviousPageClick={this.handlePreviousPageClick}
          onRowSizeChange={this.handleRowSizeChanged}
          onRowSelection={this.handleRowsSelected}
          selectedRows={clearSelectedMessages ? null : this.state.selectedRows}
        />
        <ConversationPreviewModal
          organizationTags={this.state.tags}
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
              errorCode
              messages {
                id
                text
                isFromContact
                createdAt
              }
              tags {
                id
                value
                campaignContactId
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

const mutations = {
  updateTag: ownProps => (campaignContactId, id, value) => ({
    mutation: gql`
      mutation updateContactTags(
        $tags: [ContactTagInput]
        $campaignContactId: String!
        $tagId: String!
      ) {
        updateContactTags(tags: $tags, campaignContactId: $campaignContactId) {
          id
          tags(tagId: $tagId) {
            id
            value
            campaignContactId
          }
        }
      }
    `,
    variables: {
      tags: [{ id, value }],
      campaignContactId,
      tagId: id
    }
  })
};

export default loadData({ queries, mutations })(
  withRouter(IncomingMessageList)
);
