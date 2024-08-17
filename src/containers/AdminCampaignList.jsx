import PropTypes from "prop-types";
import React, { useState } from "react";
import { StyleSheet, css } from "aphrodite";
import { withRouter } from "react-router";
import { gql } from "@apollo/client";

import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import ArchiveIcon from "@material-ui/icons/Archive";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

import LoadingIndicator from "../components/LoadingIndicator";
import { dataTest } from "../lib/attributes";
import loadData from "./hoc/load-data";
import theme from "../styles/theme";
import SortBy, {
  ID_DESC_SORT
} from "../components/AdminCampaignList/SortBy";
import Search from "../components/Search";
import CampaignTable from "../components/AdminCampaignList/CampaignTable";

const styles = StyleSheet.create({
  settings: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: "20px"
  }
});

const INITIAL_ROW_SIZE = 50;
const INITIAL_FILTER = {
  isArchived: false,
  searchString: ""
};
const INITIAL_SORT_BY = ID_DESC_SORT.value;

export function AdminCampaignList({
  params,
  mutations,
  router,
  data
  }) {
    
  const [state, setState] = useState({
    pageSize: INITIAL_ROW_SIZE,
    page: 0,
    isLoading: false,
    campaignsFilter: INITIAL_FILTER,
    archiveMultiple: false,
    campaignsToArchive: [],
    campaignsWithChangingStatus: [],
    sortBy: INITIAL_SORT_BY,
    archiveMultipleMenu: false
  });

  const { adminPerms } = params;

  const handleClickNewButton = async () => {
    const { organizationId } = params;
    setState({ 
      ...state,
      isLoading: true 
    });
    const newCampaign = await mutations.createCampaign({
      title: "New Campaign",
      description: "",
      dueBy: null,
      organizationId,
      interactionSteps: {
        script: "",
        id: "new"
      }
    });

    if (newCampaign.errors) {
      alert("There was an error creating your campaign");
      throw new Error(newCampaign.errors);
    }

    await router.push(
      `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    );
  };

  const handleClickArchiveMultipleButton = async keys => {
    if (keys.length) {
      setState({ 
        ...state,
        isLoading: true 
      });
      await mutations.archiveCampaigns(keys);
      await data.refetch();
      setState({
        ...state,
        archiveMultiple: false,
        isLoading: false,
        campaignsToArchive: []
      });
    }
  };

  const handleArchiveFilterChange = async event => {
    changeFilter({ isArchived: event.target.value });
  };

  const handleChecked = campaignIds => {
    setState({
      ...state,
      campaignsToArchive: [...campaignIds]
    });
  };

  const handleSearchRequested = searchString => {
    const campaignsFilter = {
      ...state.campaignsFilter,
      searchString
    };
    changeFilter(campaignsFilter);
  };

  const handleCancelSearch = () => {
    const campaignsFilter = {
      ...state.campaignsFilter,
      searchString: ""
    };
    changeFilter(campaignsFilter);
  };

  const renderArchivedAndSortBy = () => {
    return (
      !state.archiveMultiple && (
        <React.Fragment>
          <Select
            value={state.campaignsFilter.isArchived}
            onChange={handleArchiveFilterChange}
            style={{ marginRight: "20px" }}
          >
            <MenuItem value={false}>Current</MenuItem>
            <MenuItem value>Archived</MenuItem>
          </Select>
          <SortBy onChange={changeSortBy} sortBy={state.sortBy} />
        </React.Fragment>
      )
    );
  };

  const renderSearch = () => {
    return (
      !state.archiveMultiple && (
        <div style={{ width: "100%" }}>
          <Search
            onSearchRequested={handleSearchRequested}
            searchString={state.campaignsFilter.searchString}
            onCancelSearch={handleCancelSearch}
          />
        </div>
      )
    );
  };

  const renderFilters = () => (
    <Paper className={css(styles.settings)} elevation={3}>
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {params.adminPerms && renderArchiveMultiple()}
        {renderArchivedAndSortBy()}
      </div>
      {renderSearch()}
    </Paper>
  );

  const handleMenuClick = event => {
    console.log("event.target", event.target);
    setState({ 
      ...state,
      menuAnchorEl: event.target });
  };

  const handleMenuClose = () => {
    setState({ 
      ...state,
      menuAnchorEl: null 
    });
  };

  const renderArchiveMultiple = () => {
    const iconButton = (
      <IconButton
        onClick={event => {
          handleMenuClick(event);
          setState({
            ...state,
            archiveMultipleMenu: !state.archiveMultipleMenu
          });
        }}
      >
        <MoreVertIcon />
      </IconButton>
    );

    if (state.campaignsFilter.isArchived) {
      return iconButton;
    }

    return (
      <React.Fragment>
        {iconButton}
        <Menu
          open={state.archiveMultipleMenu}
          anchorEl={state.menuAnchorEl}
        >
          {state.archiveMultiple ? (
            <MenuItem
              onClick={() => {
                setState({
                  ...state,
                  archiveMultipleMenu: !state.archiveMultipleMenu,
                  archiveMultiple: !state.archiveMultiple
                });
              }}
            >
              Cancel
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                setState({
                  ...state,
                  archiveMultipleMenu: !state.archiveMultipleMenu,
                  archiveMultiple: !state.archiveMultiple
                });
              }}
            >
              Archive multiple campaigns
            </MenuItem>
          )}
        </Menu>
      </React.Fragment>
    );
  }

  const changePage = (pageDelta, pageSize) => {
    const {
      limit,
      offset,
      total
    } = data.organization.campaigns.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const pageSizeAdjustedCurrentPage = Math.floor(
      (currentPage * limit) / pageSize
    );
    const maxPage = Math.floor(total / pageSize);
    const newPage = Math.min(maxPage, pageSizeAdjustedCurrentPage + pageDelta);
    data.fetchMore({
      variables: {
        cursor: {
          offset: newPage * pageSize,
          limit: pageSize
        }
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }
        return fetchMoreResult;
      }
    });
  };

  const changeFilter = async newFilter => {
    setState({
      ...state,
      isLoading: true,
      campaignsFilter: newFilter
    });
    await data.refetch({
      campaignsFilter: newFilter
    });
    setState({ 
      ...state, 
      isLoading: false 
    });
  };

  const changeSortBy = async newSort => {
    setState({
      ...state,
      isLoading: true,
      sortBy: newSort
    });
    await data.refetch({
      sortBy: newSort
    });
    setState({ 
      ...state,
      isLoading: false 
    });
  };

  const handleNextPageClick = () => {
    changePage(1, state.pageSize);
  };

  const handlePreviousPageClick = () => {
    changePage(-1, state.pageSize);
  };

  const handleRowSizeChanged = (index, value) => {
    console.log("rowsizechanged", index, value); // eslint-disable-line no-console
    changePage(0, value);
    setState({
      ...state,
      pageSize: value
    });
  };

  const changeCampaignStatus = async (campaignId, changeFn) => {
    setState({
      ...state,
      campaignsWithChangingStatus: state.campaignsWithChangingStatus.concat(
        [campaignId]
      )
    });
    await changeFn(campaignId);
    await data.refetch();
    setState({
      ...state,
      campaignsWithChangingStatus: state.campaignsWithChangingStatus.filter(
        id => id !== campaignId
      )
    });
  };

  const handleArchiveCampaign = async campaignId => {
    await changeCampaignStatus(campaignId, async id => {
      await mutations.archiveCampaigns([id]);
    });
  };

  const handleUnarchiveCampaign = async campaignId => {
    await changeCampaignStatus(
      campaignId,
      mutations.unarchiveCampaign
    );
  };

  const renderActionButton = () => {
    if (state.archiveMultiple) {
      const keys = state.campaignsToArchive;
      return (
        <Fab
          color="primary"
          {...dataTest("archiveCampaigns")}
          style={theme.components.floatingButton}
          onClick={() => handleClickArchiveMultipleButton(keys)}
          disabled={!keys.length}
        >
          <ArchiveIcon />
        </Fab>
      );
    }
    return (
      <Fab
        color="primary"
        {...dataTest("addCampaign")}
        style={theme.components.floatingButton}
        onClick={handleClickNewButton}
      >
        <AddIcon />
      </Fab>
    );
  }

  return (
    <div>
      {renderFilters()}
      {state.isLoading ? (
        <LoadingIndicator />
      ) : (
        <CampaignTable
          data={data}
          campaignsToArchive={state.campaignsToArchive}
          campaignsWithChangingStatus={state.campaignsWithChangingStatus}
          currentSortBy={state.sortBy}
          onNextPageClick={handleNextPageClick}
          onPreviousPageClick={handlePreviousPageClick}
          onRowSizeChange={handleRowSizeChanged}
          adminPerms={params.adminPerms}
          selectMultiple={state.archiveMultiple}
          organizationId={params.organizationId}
          handleChecked={handleChecked}
          archiveCampaign={handleArchiveCampaign}
          unarchiveCampaign={handleUnarchiveCampaign}
        />
      )}

      {adminPerms && renderActionButton()}
    </div>
  );
}

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  isArchivedPermanently
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  timezone
  dueBy
  organization {
    id
  }
  creator {
    displayName
  }
  ingestMethod {
    success
    contactsCount
  }
  completionStats {
    assignedCount
    contactsCount
    errorCount
    messagedCount
    needsResponseCount
  }
`;

export const getCampaignsQuery = gql`
  query adminGetCampaigns(
    $organizationId: String!,
    $campaignsFilter: CampaignsFilter,
    $cursor: OffsetLimitCursor,
    $sortBy: SortCampaignsBy) {
  organization(id: $organizationId) {
    id
    cacheable
    campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
      ... on CampaignsList {
        campaigns {
          ${campaignInfoFragment}
        }
      }
      ... on PaginatedCampaigns {
        pageInfo {
          offset
          limit
          total
        }
        campaigns {
          ${campaignInfoFragment}
        }
      }
    }
  }
}
`;

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns(
        $organizationId: String!,
        $campaignsFilter: CampaignsFilter,
        $cursor: OffsetLimitCursor,
        $sortBy: SortCampaignsBy) {
      organization(id: $organizationId) {
        id
        cacheable
        campaigns(campaignsFilter: $campaignsFilter, cursor: $cursor, sortBy: $sortBy) {
          ... on CampaignsList{
            campaigns{
              ${campaignInfoFragment}
            }
          }
          ... on PaginatedCampaigns{
              pageInfo {
                offset
                limit
                total
              }
              campaigns{
                ${campaignInfoFragment}
              }
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        cursor: { offset: 0, limit: 50 },
        organizationId: ownProps.params.organizationId,
        campaignsFilter: INITIAL_FILTER,
        sortBy: INITIAL_SORT_BY
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  createCampaign: ownProps => campaign => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  }),
  archiveCampaigns: ownProps => ids => ({
    mutation: gql`
      mutation archiveCampaigns($ids: [String!]) {
        archiveCampaigns(ids: $ids) {
          id
        }
      }
    `,
    variables: { ids }
  }),
  unarchiveCampaign: ownProps => campaignId => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  })
};

AdminCampaignList.propTypes = {
  params: PropTypes.object,
  mutations: PropTypes.exact({
    createCampaign: PropTypes.func,
    archiveCampaigns: PropTypes.func,
    unarchiveCampaign: PropTypes.func
  }),
  data: PropTypes.object,
  router: PropTypes.object
};

export default loadData({ queries, mutations })(withRouter(AdminCampaignList));
