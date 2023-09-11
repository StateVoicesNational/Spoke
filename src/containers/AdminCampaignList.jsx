import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import { withRouter } from "react-router";
import gql from "graphql-tag";

import Button from "@material-ui/core/Button"
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
  DUE_DATE_DESC_SORT
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
const INITIAL_SORT_BY = DUE_DATE_DESC_SORT.value;

export class AdminCampaignList extends React.Component {
  static propTypes = {
    params: PropTypes.object,
    mutations: PropTypes.exact({
      createCampaign: PropTypes.func,
      archiveCampaigns: PropTypes.func,
      unarchiveCampaign: PropTypes.func
    }),
    data: PropTypes.object,
    router: PropTypes.object
  };

  state = {
    pageSize: INITIAL_ROW_SIZE,
    page: 0,
    isLoading: false,
    campaignsFilter: INITIAL_FILTER,
    archiveMultiple: false,
    campaignsToArchive: [],
    campaignsWithChangingStatus: [],
    sortBy: INITIAL_SORT_BY,
    archiveMultipleMenu: false
  };

  createNewCampaignButton = async () => {
    const { organizationId } = this.props.params;
    this.setState({ isLoading: true });
    const newCampaign = await this.props.mutations.createCampaign({
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

    await this.props.router.push(
      `/admin/${organizationId}/campaigns/${newCampaign.data.createCampaign.id}/edit?new=true`
    );
  };

  handleClickArchiveMultipleButton = async keys => {
    if (keys.length) {
      this.setState({ isLoading: true });
      await this.props.mutations.archiveCampaigns(keys);
      await this.props.data.refetch();
      this.setState({
        archiveMultiple: false,
        isLoading: false,
        campaignsToArchive: []
      });
    }
  };

  handleArchiveFilterChange = async event => {
    this.changeFilter({ isArchived: event.target.value });
  };

  handleChecked = campaignIds => {
    this.setState({
      campaignsToArchive: [...campaignIds]
    });
  };

  handleSearchRequested = searchString => {
    const campaignsFilter = {
      ...this.state.campaignsFilter,
      searchString
    };
    this.changeFilter(campaignsFilter);
  };

  handleCancelSearch = () => {
    const campaignsFilter = {
      ...this.state.campaignsFilter,
      searchString: ""
    };
    this.changeFilter(campaignsFilter);
  };

  renderArchivedAndSortBy = () => {
    return (
      !this.state.archiveMultiple && (
        <React.Fragment>
          <Select
            value={this.state.campaignsFilter.isArchived}
            onChange={this.handleArchiveFilterChange}
            style={{ marginRight: "20px" }}
          >
            <MenuItem value={false}>Current</MenuItem>
            <MenuItem value>Archived</MenuItem>
          </Select>
          <SortBy onChange={this.changeSortBy} sortBy={this.state.sortBy} />
        </React.Fragment>
      )
    );
  };

  renderSearch = () => {
    return (
      !this.state.archiveMultiple && (
        <div style={{ width: "100%" }}>
          <Search
            onSearchRequested={this.handleSearchRequested}
            searchString={this.state.campaignsFilter.searchString}
            onCancelSearch={this.handleCancelSearch}
          />
        </div>
      )
    );
  };

  renderFilters = () => (
    <Paper className={css(styles.settings)} elevation={3}>
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {this.props.params.adminPerms && this.renderArchiveMultiple()}
        {this.renderArchivedAndSortBy()}
      </div>
      {this.renderSearch()}
    </Paper>
  );

  handleMenuClick = event => {
    console.log("event.target", event.target);
    this.setState({ menuAnchorEl: event.target });
  };

  handleMenuClose = () => {
    this.setState({ menuAnchorEl: null });
  };

  renderArchiveMultiple() {
    const iconButton = (
      <IconButton
        onClick={event => {
          this.handleMenuClick(event);
          this.setState({
            archiveMultipleMenu: !this.state.archiveMultipleMenu
          });
        }}
      >
        <MoreVertIcon />
      </IconButton>
    );

    if (this.state.campaignsFilter.isArchived) {
      return iconButton;
    }

    return (
      <React.Fragment>
        {iconButton}
        <Menu
          open={this.state.archiveMultipleMenu}
          anchorEl={this.state.menuAnchorEl}
        >
          {this.state.archiveMultiple ? (
            <MenuItem
              onClick={() => {
                this.setState({
                  archiveMultipleMenu: !this.state.archiveMultipleMenu,
                  archiveMultiple: !this.state.archiveMultiple
                });
              }}
            >
              Cancel
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                this.setState({
                  archiveMultipleMenu: !this.state.archiveMultipleMenu,
                  archiveMultiple: !this.state.archiveMultiple
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

  changePage = (pageDelta, pageSize) => {
    const {
      limit,
      offset,
      total
    } = this.props.data.organization.campaigns.pageInfo;
    const currentPage = Math.floor(offset / limit);
    const pageSizeAdjustedCurrentPage = Math.floor(
      (currentPage * limit) / pageSize
    );
    const maxPage = Math.floor(total / pageSize);
    const newPage = Math.min(maxPage, pageSizeAdjustedCurrentPage + pageDelta);
    this.props.data.fetchMore({
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

  changeFilter = async newFilter => {
    this.setState({
      isLoading: true,
      campaignsFilter: newFilter
    });
    await this.props.data.refetch({
      campaignsFilter: newFilter
    });
    this.setState({ isLoading: false });
  };

  changeSortBy = async newSort => {
    this.setState({
      isLoading: true,
      sortBy: newSort
    });
    await this.props.data.refetch({
      sortBy: newSort
    });
    this.setState({ isLoading: false });
  };

  handleNextPageClick = () => {
    this.changePage(1, this.state.pageSize);
  };

  handlePreviousPageClick = () => {
    this.changePage(-1, this.state.pageSize);
  };

  handleRowSizeChanged = (index, value) => {
    console.log("rowsizechanged", index, value); // eslint-disable-line no-console
    this.changePage(0, value);
    this.setState({
      pageSize: value
    });
  };

  changeCampaignStatus = async (campaignId, changeFn) => {
    this.setState({
      campaignsWithChangingStatus: this.state.campaignsWithChangingStatus.concat(
        [campaignId]
      )
    });
    await changeFn(campaignId);
    await this.props.data.refetch();
    this.setState({
      campaignsWithChangingStatus: this.state.campaignsWithChangingStatus.filter(
        id => id !== campaignId
      )
    });
  };

  handleArchiveCampaign = async campaignId => {
    await this.changeCampaignStatus(campaignId, async id => {
      await this.props.mutations.archiveCampaigns([id]);
    });
  };

  handleUnarchiveCampaign = async campaignId => {
    await this.changeCampaignStatus(
      campaignId,
      this.props.mutations.unarchiveCampaign
    );
  };

  renderActionButton() {
    if (this.state.archiveMultiple) {
      const keys = this.state.campaignsToArchive;
      return (
        <Fab
          color="primary"
          {...dataTest("archiveCampaigns")}
          style={theme.components.floatingButton}
          onClick={() => this.handleClickArchiveMultipleButton(keys)}
          disabled={!keys.length}
        >
          <ArchiveIcon />
        </Fab>
      );
    }
    // add campaign button
    return (
      <Button 
          style={theme.components.floatingButton}
          color="primary"
          variant="contained"
          {...dataTest("addCampaign")}
          onClick={this.createNewCampaignButton}
      >Create New Campaign
      </Button>
      
    );
  }

  render() {
    const { adminPerms } = this.props.params;
    return (
      <div>
        {this.renderFilters()}
        {this.state.isLoading ? (
          <LoadingIndicator />
        ) : (
          <CampaignTable
            data={this.props.data}
            campaignsToArchive={this.state.campaignsToArchive}
            campaignsWithChangingStatus={this.state.campaignsWithChangingStatus}
            currentSortBy={this.state.sortBy}
            onNextPageClick={this.handleNextPageClick}
            onPreviousPageClick={this.handlePreviousPageClick}
            onRowSizeChange={this.handleRowSizeChanged}
            adminPerms={this.props.params.adminPerms}
            selectMultiple={this.state.archiveMultiple}
            organizationId={this.props.params.organizationId}
            handleChecked={this.handleChecked}
            archiveCampaign={this.handleArchiveCampaign}
            unarchiveCampaign={this.handleUnarchiveCampaign}
          />
        )}

        {adminPerms && this.renderActionButton()}
      </div>
    );
  }
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

export default loadData({ queries, mutations })(withRouter(AdminCampaignList));
