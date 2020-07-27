import PropTypes from "prop-types";
import React from "react";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import ArchiveIcon from "material-ui/svg-icons/content/archive";
import MoreVertIcon from "material-ui/svg-icons/navigation/more-vert";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import theme from "../styles/theme";
import LoadingIndicator from "../components/LoadingIndicator";
import DropDownMenu from "material-ui/DropDownMenu";
import IconMenu from "material-ui/IconMenu";
import { MenuItem } from "material-ui/Menu";
import { dataTest } from "../lib/attributes";
import IconButton from "material-ui/IconButton/IconButton";
import SortBy, {
  DUE_DATE_DESC_SORT
} from "../components/AdminCampaignList/SortBy";
import Paper from "material-ui/Paper";
import Search from "../components/Search";
import { StyleSheet, css } from "aphrodite";
import CampaignTable from "../components/AdminCampaignList/CampaignTable";

const styles = StyleSheet.create({
  settings: {
    display: "flex",
    flexDirection: "row",
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
    sortBy: INITIAL_SORT_BY
  };

  handleClickNewButton = async () => {
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

  handleArchiveFilterChange = async (event, index, isArchived) => {
    this.changeFilter({ isArchived });
  };

  handleChecked = campaignIds => {
    this.setState({
      campaignsToArchive: [...campaignIds]
    });
  };

  toggleStateWithDelay = (property, delay) => {
    setTimeout(() => {
      this.setState(prevState => ({ [property]: !prevState[property] }));
    }, delay);
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
        <span>
          <span>
            <DropDownMenu
              value={this.state.campaignsFilter.isArchived}
              onChange={this.handleArchiveFilterChange}
            >
              <MenuItem value={false} primaryText="Current" />
              <MenuItem value primaryText="Archived" />
            </DropDownMenu>
            <SortBy onChange={this.changeSortBy} sortBy={this.state.sortBy} />
          </span>
        </span>
      )
    );
  };

  renderSearch = () => {
    return (
      !this.state.archiveMultiple && (
        <Search
          onSearchRequested={this.handleSearchRequested}
          searchString={this.state.campaignsFilter.searchString}
          onCancelSearch={this.handleCancelSearch}
          hintText="Search for campaign title. Hit enter to search."
          style={{ width: "50%" }}
        />
      )
    );
  };

  renderFilters = () => (
    <Paper className={css(styles.settings)} zDepth={3}>
      {this.props.params.adminPerms && this.renderArchiveMultiple()}
      {this.renderArchivedAndSortBy()}
      {this.renderSearch()}
    </Paper>
  );

  renderArchiveMultiple() {
    const iconButton = (
      <IconButton>
        <MoreVertIcon />
      </IconButton>
    );

    if (this.state.campaignsFilter.isArchived) {
      return iconButton;
    }

    return (
      <IconMenu iconButtonElement={iconButton}>
        {/*
          The IconMenu component delays hiding the menu after it is
          clicked for 200ms. This looks nice, so the state change is
          delayed for 201ms to avoid switching the menu text before the
          menu is hidden.
        */}
        {this.state.archiveMultiple ? (
          <MenuItem
            primaryText="Cancel"
            onClick={() => {
              this.toggleStateWithDelay("archiveMultiple", 250);
            }}
          />
        ) : (
          <MenuItem
            primaryText="Archive multiple campaigns"
            onClick={() => {
              this.toggleStateWithDelay("archiveMultiple", 250);
            }}
          />
        )}
      </IconMenu>
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
        <FloatingActionButton
          {...dataTest("archiveCampaigns")}
          style={theme.components.floatingButton}
          onTouchTap={() => this.handleClickArchiveMultipleButton(keys)}
          disabled={!keys.length}
        >
          <ArchiveIcon />
        </FloatingActionButton>
      );
    }
    return (
      <FloatingActionButton
        {...dataTest("addCampaign")}
        style={theme.components.floatingButton}
        onTouchTap={this.handleClickNewButton}
      >
        <ContentAdd />
      </FloatingActionButton>
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
  hasUnassignedContacts
  hasUnsentInitialMessages
  description
  timezone
  dueBy
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
