import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import _ from "lodash";
import OrganizationJoinLink from "../components/OrganizationJoinLink";

import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import theme from "../styles/theme";
import loadData from "./hoc/load-data";
import { gql } from "@apollo/client";
import { dataTest } from "../lib/attributes";
import PeopleList from "../containers/PeopleList";
import { StyleSheet, css } from "aphrodite";
import Search from "../components/Search";
import SimpleRolesDropdown, {
  ALL_ROLES
} from "../components/PeopleList/SimpleRolesDropdown";

export const ALL_CAMPAIGNS = -1;

const CAMPAIGN_FILTER_SORT =
  (typeof window !== "undefined" && window.PEOPLE_PAGE_CAMPAIGN_FILTER_SORT) ||
  "ID_ASC";

const styles = StyleSheet.create({
  settings: {
    display: "flex",
    flexDirection: "column",
    padding: 20,
    marginBottom: 20
  },
  selects: {
    display: "flex",
    flexWrap: "wrap"
  },
  select: {
    margin: "0 20px 20px 0"
  }
});

class AdminPersonList extends React.Component {
  constructor(props) {
    super(props);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false,
      userEdit: false,
      passwordResetHash: "",
      resetLink: false
    };
  }

  FIRST_NAME_SORT = {
    display: "First Name",
    value: "FIRST_NAME"
  };
  LAST_NAME_SORT = {
    display: "Last Name",
    value: "LAST_NAME"
  };
  NEWEST_SORT = {
    display: "Newest",
    value: "NEWEST"
  };

  OLDEST_SORT = {
    display: "Oldest",
    value: "OLDEST"
  };

  SORTS = [
    this.FIRST_NAME_SORT,
    this.LAST_NAME_SORT,
    this.NEWEST_SORT,
    this.OLDEST_SORT
  ];

  DEFAULT_SORT_BY_VALUE = this.FIRST_NAME_SORT.value;

  FIRST_NAME_FILTER = {
    display: "First Name",
    value: "FIRST_NAME"
  };
  LAST_NAME_FILTER = {
    display: "Last Name",
    value: "LAST_NAME"
  };
  EMAIL_FILTER = {
    display: "Email",
    value: "EMAIL"
  };

  ANY_FILTER = {
    display: "Any",
    value: "ANY"
  };

  FILTERS = [
    this.FIRST_NAME_FILTER,
    this.LAST_NAME_FILTER,
    this.EMAIL_FILTER,
    this.ANY_FILTER
  ];

  DEFAULT_FILTER_BY_VALUE = this.FIRST_NAME_FILTER.value;

  makeQueryItem = (name, value) => {
    return value ? `${name}=${value}` : undefined;
  };

  determineCampaignIdForFilter = changedItems => {
    if (changedItems.campaignId && changedItems.campaignId === ALL_CAMPAIGNS) {
      return undefined;
    }

    return changedItems.campaignId || this.props.location.query.campaignId;
  };

  handleFilterChange = changedItems => {
    const campaignId = this.makeQueryItem(
      "campaignId",
      this.determineCampaignIdForFilter(changedItems)
    );
    const sortBy = this.makeQueryItem(
      "sortBy",
      changedItems.sortBy || this.props.location.query.sortBy
    );
    const filterBy = this.makeQueryItem(
      "filterBy",
      changedItems.filterBy || this.props.location.query.filterBy
    );
    const role =
      changedItems.role !== ALL_ROLES &&
      this.makeQueryItem(
        "role",
        changedItems.role || this.props.location.query.role
      );
    const searchString = this.makeQueryItem(
      "searchString",
      _.has(changedItems, "searchString")
        ? changedItems.searchString
        : this.props.location.query.searchString
    );

    const query = [campaignId, sortBy, filterBy, role, searchString]
      .filter(item => item !== undefined)
      .join("&");

    this.props.router.push(
      `/admin/${this.props.params.organizationId}/people${query && "?" + query}`
    );
  };

  handleCampaignChange = event => {
    // We send 0 when there is a campaign change, because presumably we start on page 1
    this.handleFilterChange({ campaignId: event.target.index });
  };

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false, passwordResetHash: "" });
  }

  handleResetInviteLink = async () => {
    console.log("handleResetInviteLink");
    await this.props.mutations.resetOrganizationJoinLink();
    this.setState({ resetLink: false });
  };

  handleSortByChanged = event => {
    this.handleFilterChange({ sortBy: event.target.value });
  };

  handleFilterByChanged = event => {
    this.handleFilterChange({ filterBy: event.target.value });
  };

  handleSearchRequested = searchString => {
    this.handleFilterChange({ searchString });
  };

  handleRoleChanged = role => {
    this.handleFilterChange({ role });
  };

  renderCampaignList = () => {
    const {
      organizationData: { organization }
    } = this.props;
    const campaigns = organization ? organization.campaigns : { campaigns: [] };
    return (
      <Select
        value={this.props.location.query.campaignId || ALL_CAMPAIGNS}
        onChange={this.handleCampaignChange}
      >
        <MenuItem value={ALL_CAMPAIGNS} key={ALL_CAMPAIGNS}>
          All Campaigns
        </MenuItem>
        {campaigns.campaigns.map(campaign => (
          <MenuItem value={campaign.id} key={campaign.id}>
            {campaign.title}
          </MenuItem>
        ))}
      </Select>
    );
  };

  renderSortBy = () => (
    <Select
      value={this.props.location.query.sortBy || this.DEFAULT_SORT_BY_VALUE}
      onChange={this.handleSortByChanged}
    >
      {this.SORTS.map(sort => (
        <MenuItem value={sort.value} key={sort.value}>
          Sort by {sort.display}
        </MenuItem>
      ))}
    </Select>
  );

  renderFilterBy = () => (
    <Select
      value={this.props.location.query.filterBy || this.DEFAULT_FILTER_BY_VALUE}
      onChange={this.handleFilterByChanged}
    >
      {this.FILTERS.map(filter => (
        <MenuItem value={filter.value} key={filter.value}>
          Filter by {filter.display}
        </MenuItem>
      ))}
    </Select>
  );

  renderRoles = () => (
    <SimpleRolesDropdown
      onChange={this.handleRoleChanged}
      selectedRole={this.props.location.query.role || ALL_ROLES}
    />
  );

  render() {
    const { organizationData } = this.props;
    const {
      userData: { currentUser }
    } = this.props;
    const joinActions = [
      <Button
        {...dataTest("inviteOk")}
        color="primary"
        onClick={this.handleClose}
      >
        OK
      </Button>
    ];
    if (currentUser.roles.indexOf("ADMIN") !== -1) {
      if (this.state.resetLink) {
        joinActions.unshift(
          <Button
            {...dataTest("inviteResetConfirm")}
            onClick={this.handleResetInviteLink}
          >
            Confirm Reset Link -- will break current link
          </Button>,
          <Button
            {...dataTest("inviteResetCancel")}
            onClick={() => this.setState({ resetLink: false })}
          >
            Cancel
          </Button>
        );
      } else {
        joinActions.unshift(
          <Button
            {...dataTest("inviteReset")}
            onClick={() => this.setState({ resetLink: true })}
          >
            Reset Link (Security)
          </Button>
        );
      }
    }
    return (
      <div>
        <Paper className={css(styles.settings)} elevation={3}>
          <div className={css(styles.selects)}>
            <div className={css(styles.select)}>
              {this.renderCampaignList()}
            </div>
            <div className={css(styles.select)}>{this.renderRoles()}</div>
            <div className={css(styles.select)}>{this.renderSortBy()}</div>
            <div className={css(styles.select)}>{this.renderFilterBy()}</div>
          </div>
          <Search
            onSearchRequested={this.handleSearchRequested}
            searchString={this.props.location.query.searchString}
            onCancelSearch={this.handleCancelSearch}
            hintText="Search for first name, last name, or email. Hit enter to search."
          />
        </Paper>
        <PeopleList
          organizationId={
            organizationData.organization && organizationData.organization.id
          }
          campaignsFilter={{
            campaignId:
              this.props.location.query.campaignId &&
              parseInt(this.props.location.query.campaignId, 10)
          }}
          utc={this.state.utc}
          currentUser={currentUser}
          sortBy={
            this.props.location.query.sortBy || this.DEFAULT_SORT_BY_VALUE
          }
          filterBy={
            this.props.location.query.filterBy || this.DEFAULT_FILTER_BY_VALUE
          }
          searchString={this.props.location.query.searchString}
          role={this.props.location.query.role}
          location={this.props.location}
        />
        <Fab
          {...dataTest("addPerson")}
          color="primary"
          style={theme.components.floatingButton}
          onClick={this.handleOpen}
        >
          <AddIcon />
        </Fab>
        {organizationData.organization && (
          <div>
            <Dialog
              actions={joinActions}
              open={this.state.open}
              onClose={this.handleClose}
            >
              <DialogTitle>Invite new texters</DialogTitle>
              <DialogContent>
                <OrganizationJoinLink
                  organizationUuid={organizationData.organization.uuid}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    );
  }
}

AdminPersonList.propTypes = {
  mutations: PropTypes.object,
  params: PropTypes.object,
  userData: PropTypes.object,
  organizationData: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
};

const mutations = {
  resetOrganizationJoinLink: ownProps => () => ({
    mutation: gql`
      mutation resetOrganizationJoinLink($organizationId: String!) {
        resetOrganizationJoinLink(organizationId: $organizationId) {
          id
          uuid
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationData.organization.id
    }
  })
};

const queries = {
  userData: {
    query: gql`
      query getCurrentUserAndRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData(
        $organizationId: String!
        $sortBy: SortCampaignsBy
      ) {
        organization(id: $organizationId) {
          id
          uuid
          theme
          campaigns(campaignsFilter: { isArchived: false }, sortBy: $sortBy) {
            ... on CampaignsList {
              campaigns {
                id
                title
              }
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId,
        sortBy: CAMPAIGN_FILTER_SORT
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries, mutations })(withRouter(AdminPersonList));
