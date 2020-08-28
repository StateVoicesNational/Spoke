import PropTypes from "prop-types";
import React, { Component } from "react";
import _ from "lodash";

import IncomingMessageActions from "../components/IncomingMessageActions";
import IncomingMessageFilter, {
  ALL_CAMPAIGNS
} from "../components/IncomingMessageFilter";
import IncomingMessageList from "../components/IncomingMessageList";
import PaginatedCampaignsRetriever from "./PaginatedCampaignsRetriever";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import PaginatedUsersRetriever from "./PaginatedUsersRetriever";
import * as queryString from "query-string";

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
  let isArchived = undefined;
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true;
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false;
  }

  if (isArchived !== undefined) {
    return { isArchived };
  }

  return {};
}

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined;
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true;
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false;
  }

  if (isOptedOut !== undefined) {
    return { isOptedOut };
  }

  return {};
}

export class AdminIncomingMessageList extends Component {
  static tagsFilterStateFromTagsFilter = tagsFilter => {
    let newTagsFilter = null;
    if (tagsFilter.anyTag) {
      newTagsFilter = ["*"];
    } else if (tagsFilter.noTag) {
      newTagsFilter = [];
    } else if (!tagsFilter.ignoreTags) {
      newTagsFilter = Object.values(tagsFilter.selectedTags).map(
        tagFilter => tagFilter.id
      );
    }
    return newTagsFilter;
  };

  constructor(props) {
    super(props);

    const query = props.location.query;
    console.log("constructor");
    this.state = {
      page: 0,
      pageSize: 10,
      campaignsFilter: { isArchived: false },
      contactsFilter: { isOptedOut: false },
      messageTextFilter: query.messageText ? query.messageText : "",
      assignmentsFilter: query.texterId
        ? { texterId: Number(query.texterId) }
        : {},
      needsRender: false,
      utc: Date.now().toString(),
      campaigns: [],
      reassignmentTexters: [],
      campaignTexters: [],
      includeArchivedCampaigns: query.archived
        ? Boolean(parseInt(query.archived))
        : false,
      conversationCount: 0,
      includeActiveCampaigns: query.active
        ? Boolean(parseInt(query.active))
        : true,
      includeNotOptedOutConversations: query.notOptedOut
        ? Boolean(parseInt(query.notOptedOut))
        : true,
      includeOptedOutConversations: query.optedOut
        ? Boolean(parseInt(query.optedOut))
        : false,
      clearSelectedMessages: false,
      tagsFilter: { ignoreTags: true }
    };
    if (query.campaigns) {
      this.state.campaignsFilter.campaignIds = query.campaigns.split(",");
    }
    if (query.messageStatus) {
      this.state.contactsFilter.messageStatus = query.messageStatus;
    }
    if (query.errorCode) {
      this.state.contactsFilter.errorCode = query.errorCode.split(",");
    }
    if (query.tags) {
      if (/^[a-z]/.test(query.tags)) {
        this.state.tagsFilter = { [query.tags]: true };
      } else {
        const selectedTags = {};
        query.tags.split(",").forEach(t => {
          selectedTags[t] = props.organization.organization.tags.find(
            ot => ot.id === t
          );
        });
        this.state.tagsFilter = { selectedTags };
      }
    }
    const newTagsFilter = AdminIncomingMessageList.tagsFilterStateFromTagsFilter(
      this.state.tagsFilter
    );
    this.state.contactsFilter.tags = newTagsFilter;
  }

  shouldComponentUpdate = (dummy, nextState) => {
    console.log("shouldComponentUpdate", nextState.needsRender);
    if (
      !nextState.needsRender &&
      _.isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      _.isEqual(this.state.campaignsFilter, nextState.campaignsFilter) &&
      _.isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter)
    ) {
      return false;
    }
    console.log("shouldComponentUpdate updating");
    return true;
  };

  componentDidUpdate = () => {
    if (this.state.clearSelectedMessages) {
      this.setState({
        clearSelectedMessages: false,
        needsRender: true
      });
    }
  };

  componentWillUpdate = (nextProps, nextState) => {
    if (nextState !== this.state) {
      const query = {};
      if (nextState.messageTextFilter) {
        query.messageText = nextState.messageTextFilter;
      }
      if (nextState.assignmentsFilter.texterId) {
        query.texterId = nextState.assignmentsFilter.texterId;
      }
      if (
        nextState.campaignsFilter.campaignIds &&
        nextState.campaignsFilter.campaignIds.length
      ) {
        query.campaigns = nextState.campaignsFilter.campaignIds.join(",");
      }
      if (nextState.contactsFilter.messageStatus) {
        query.messageStatus = nextState.contactsFilter.messageStatus;
      }
      if (nextState.contactsFilter.errorCode) {
        query.errorCode = nextState.contactsFilter.errorCode.join(",");
      }
      if (nextState.tagsFilter && !nextState.tagsFilter.ignoreTags) {
        if (nextState.tagsFilter.anyTag) {
          query.tags = "anyTag";
        } else if (nextState.tagsFilter.noTag) {
          query.tags = "noTag";
        } else {
          const selectedTags = Object.keys(
            nextState.tagsFilter.selectedTags || {}
          ).filter(t => t);
          query.tags = selectedTags.join(",");
        }
      }
      //default false
      if (nextState.includeArchivedCampaigns) {
        query.archived = 1;
      }
      if (nextState.includeOptedOutConversations) {
        query.optedOut = 1;
      }
      //default true
      if (!nextState.includeActiveCampaigns) {
        query.active = 0;
      }
      if (!nextState.includeNotOptedOutConversations) {
        query.notOptedOut = 0;
      }

      history.replaceState(
        null,
        "Message Review",
        "?" + queryString.stringify(query)
      );
    }
  };

  handleCampaignChanged = async (campaignIds, selectedCampaigns) => {
    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    );
    if (!campaignIds.find(campaignId => campaignId === ALL_CAMPAIGNS)) {
      campaignsFilter.campaignIds = campaignIds;
    }

    await this.setState({
      campaignsFilter,
      selectedCampaigns,
      needsRender: true
    });
  };

  handleTexterChanged = async texterId => {
    const assignmentsFilter = {};
    if (texterId >= 0) {
      assignmentsFilter.texterId = texterId;
    }
    await this.setState({
      assignmentsFilter,
      needsRender: true
    });
  };

  handleMessageTextFilterChange = async messageTextFilter => {
    await this.setState({
      messageTextFilter,
      needsRender: true
    });
  };

  handleMessageFilterChange = async messagesFilter => {
    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ["messageStatus"]),
      { messageStatus: messagesFilter }
    );
    await this.setState({
      contactsFilter,
      needsRender: true
    });
  };

  handleErrorCodeChange = async errorCode => {
    const contactsFilter = {
      ...this.state.contactsFilter,
      errorCode: errorCode ? errorCode.split(",") : null
    };
    await this.setState({
      contactsFilter,
      needsRender: true
    });
  };

  handleReassignRequested = async newTexterUserId => {
    await this.props.mutations.reassignCampaignContacts(
      this.props.params.organizationId,
      this.state.campaignIdsContactIds,
      newTexterUserId
    );
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    });
  };

  handleReassignAllMatchingRequested = async newTexterUserId => {
    await this.props.mutations.bulkReassignCampaignContacts(
      this.props.params.organizationId,
      newTexterUserId,
      this.state.campaignsFilter || {},
      this.state.assignmentsFilter || {},
      this.state.contactsFilter || {},
      this.state.messageTextFilter || null
    );
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    });
  };

  handlePageChange = async page => {
    await this.setState({
      page,
      needsRender: true
    });
  };

  handlePageSizeChange = async pageSize => {
    await this.setState({ needsRender: true, pageSize });
  };

  handleRowSelection = async (selectedRows, data) => {
    if (this.state.previousSelectedRows === "all" && selectedRows !== "all") {
      await this.setState({
        previousSelectedRows: [],
        campaignIdsContactIds: [],
        needsRender: false
      });
    } else {
      await this.setState({
        previousSelectedRows: selectedRows,
        campaignIdsContactIds: data,
        needsRender: false
      });
    }
  };

  handleCampaignsReceived = async campaigns => {
    console.log("campaigns:", campaigns);
    let selectedCampaigns = [];
    if (this.state.campaignsFilter.campaignIds) {
      this.state.campaignsFilter.campaignIds.forEach(campaignId => {
        const campaign = campaigns.find(campaign => campaign.id == campaignId);
        const campaignDisplay = `${campaignId}: ${campaign.title}`;
        selectedCampaigns.push({ key: campaign.id, text: campaignDisplay });
      });
    }
    this.setState({ campaigns, selectedCampaigns, needsRender: true });
  };

  handleCampaignTextersReceived = async campaignTexters => {
    console.log("handleCampaignTextersReceived", campaignTexters.length);
    let texterDisplayName = "";
    if (this.state.assignmentsFilter.texterId) {
      const texter = campaignTexters.find(texter => {
        return (
          parseInt(texter.id, 10) === this.state.assignmentsFilter.texterId
        );
      });
      if (texter) {
        texterDisplayName = texter.displayName;
      }
    }
    this.setState({
      campaignTexters,
      texterSearchText: texterDisplayName,
      needsRender: true
    });
  };

  handleReassignmentTextersReceived = async reassignmentTexters => {
    this.setState({ reassignmentTexters, needsRender: true });
  };

  handleNotOptedOutConversationsToggled = async () => {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return;
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    );

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    });
  };

  handleOptedOutConversationsToggled = async () => {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations;

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    );

    const contactsFilter = Object.assign(
      _.omit(this.state.contactsFilter, ["isOptedOut"]),
      contactsFilterUpdate
    );

    this.setState({
      contactsFilter,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    });
  };

  handleActiveCampaignsToggled = async () => {
    if (
      this.state.includeActiveCampaigns &&
      !this.state.includeArchivedCampaigns
    ) {
      return;
    }

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    );
    this.setState({
      campaignsFilter,
      includeActiveCampaigns: !this.state.includeActiveCampaigns
    });
  };

  handleArchivedCampaignsToggled = async () => {
    const includeActiveCampaigns =
      this.state.includeActiveCampaigns || !this.state.includeArchivedCampaigns;

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !this.state.includeArchivedCampaigns
    );

    this.setState({
      campaignsFilter,
      includeActiveCampaigns,
      includeArchivedCampaigns: !this.state.includeArchivedCampaigns
    });
  };

  handleTagsFilterChanged = tagsFilter => {
    const newTagsFilter = AdminIncomingMessageList.tagsFilterStateFromTagsFilter(
      tagsFilter
    );

    const contactsFilter = {
      ...this.state.contactsFilter,
      tags: newTagsFilter || undefined
    };

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      tagsFilter,
      needsRender: true
    });
  };

  conversationCountChanged = conversationCount => {
    this.setState({
      conversationCount
    });
  };

  handleForceRefresh = (clearSelectedMessages = false) => {
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages
    });
  };

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    };
    return (
      <div>
        <h3> Message Review </h3>
        <div>
          <PaginatedUsersRetriever
            organizationId={this.props.params.organizationId}
            onUsersReceived={this.handleReassignmentTextersReceived}
            pageSize={1000}
          />
          <PaginatedUsersRetriever
            organizationId={this.props.params.organizationId}
            onUsersReceived={this.handleCampaignTextersReceived}
            pageSize={1000}
            campaignsFilter={this.state.campaignsFilter}
            roleFilter="ANY"
          />
          <PaginatedCampaignsRetriever
            organizationId={this.props.params.organizationId}
            campaignsFilter={_.pick(this.state.campaignsFilter, "isArchived")}
            onCampaignsReceived={this.handleCampaignsReceived}
            pageSize={1000}
          />
          <IncomingMessageFilter
            campaigns={this.state.campaigns}
            texters={this.state.campaignTexters}
            onCampaignChanged={this.handleCampaignChanged}
            onTexterChanged={this.handleTexterChanged}
            onMessageFilterChanged={this.handleMessageFilterChange}
            onMessageTextFilterChanged={this.handleMessageTextFilterChange}
            onErrorCodeChanged={this.handleErrorCodeChange}
            assignmentsFilter={this.state.assignmentsFilter}
            onActiveCampaignsToggled={this.handleActiveCampaignsToggled}
            onArchivedCampaignsToggled={this.handleArchivedCampaignsToggled}
            includeActiveCampaigns={this.state.includeActiveCampaigns}
            includeArchivedCampaigns={this.state.includeArchivedCampaigns}
            onNotOptedOutConversationsToggled={
              this.handleNotOptedOutConversationsToggled
            }
            onOptedOutConversationsToggled={
              this.handleOptedOutConversationsToggled
            }
            includeNotOptedOutConversations={
              this.state.includeNotOptedOutConversations
            }
            includeOptedOutConversations={
              this.state.includeOptedOutConversations
            }
            onTagsFilterChanged={this.handleTagsFilterChanged}
            tagsFilter={this.state.tagsFilter}
            tags={this.props.organization.organization.tags}
            messageTextFilter={this.state.messageTextFilter}
            texterSearchText={this.state.texterSearchText}
            selectedCampaigns={this.state.selectedCampaigns}
            messageFilter={this.state.contactsFilter.messageStatus}
            errorCode={this.state.contactsFilter.errorCode}
          />
          <br />
          <IncomingMessageActions
            people={this.state.reassignmentTexters}
            onReassignRequested={this.handleReassignRequested}
            onReassignAllMatchingRequested={
              this.handleReassignAllMatchingRequested
            }
            conversationCount={this.state.conversationCount}
          />
          <br />
          <IncomingMessageList
            organizationId={this.props.params.organizationId}
            cursor={cursor}
            contactsFilter={this.state.contactsFilter}
            campaignsFilter={this.state.campaignsFilter}
            assignmentsFilter={this.state.assignmentsFilter}
            messageTextFilter={this.state.messageTextFilter}
            utc={this.state.utc}
            onPageChanged={this.handlePageChange}
            onPageSizeChanged={this.handlePageSizeChange}
            onConversationSelected={this.handleRowSelection}
            onConversationCountChanged={this.conversationCountChanged}
            clearSelectedMessages={this.state.clearSelectedMessages}
            onForceRefresh={this.handleForceRefresh}
            tags={this.props.organization.organization.tags}
          />
        </div>
      </div>
    );
  }
}

export const bulkReassignCampaignContactsMutation = gql`
  mutation bulkReassignCampaignContacts(
    $organizationId: String!
    $newTexterUserId: String!
    $contactsFilter: ContactsFilter
    $campaignsFilter: CampaignsFilter
    $assignmentsFilter: AssignmentsFilter
    $messageTextFilter: String
  ) {
    bulkReassignCampaignContacts(
      organizationId: $organizationId
      newTexterUserId: $newTexterUserId
      contactsFilter: $contactsFilter
      campaignsFilter: $campaignsFilter
      assignmentsFilter: $assignmentsFilter
      messageTextFilter: $messageTextFilter
    ) {
      campaignId
      assignmentId
    }
  }
`;

export const reassignCampaignContactsMutation = gql`
  mutation reassignCampaignContacts(
    $organizationId: String!
    $campaignIdsContactIds: [CampaignIdContactId]!
    $newTexterUserId: String!
  ) {
    reassignCampaignContacts(
      organizationId: $organizationId
      campaignIdsContactIds: $campaignIdsContactIds
      newTexterUserId: $newTexterUserId
    ) {
      campaignId
      assignmentId
    }
  }
`;

AdminIncomingMessageList.propTypes = {
  conversations: PropTypes.object,
  mutations: PropTypes.object,
  params: PropTypes.object,
  organization: PropTypes.object,
  tags: PropTypes.object
};

const queries = {
  organization: {
    query: gql`
      query getOrganization($id: String!) {
        organization(id: $id) {
          id
          tags {
            id
            name
          }
        }
      }
    `,
    options: ownProps => {
      return {
        variables: {
          id: ownProps.params.organizationId
        },
        fetchPolicy: "network-only"
      };
    }
  }
};

const mutations = {
  reassignCampaignContacts: ownProps => (
    organizationId,
    campaignIdsContactIds,
    newTexterUserId
  ) => ({
    mutation: reassignCampaignContactsMutation,
    variables: { organizationId, campaignIdsContactIds, newTexterUserId }
  }),
  bulkReassignCampaignContacts: ownProps => (
    organizationId,
    newTexterUserId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    messageTextFilter
  ) => ({
    mutation: bulkReassignCampaignContactsMutation,
    variables: {
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      contactsFilter,
      messageTextFilter,
      newTexterUserId
    }
  })
};

export const operations = { mutations, queries };

export default loadData(operations)(withRouter(AdminIncomingMessageList));
