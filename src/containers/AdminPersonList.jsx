import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import _ from "lodash";
import OrganizationJoinLink from "../components/OrganizationJoinLink";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import ContentAdd from "material-ui/svg-icons/content/add";
import Dialog from "material-ui/Dialog";
import Paper from "material-ui/Paper";
import theme from "../styles/theme";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
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
    padding: "20px"
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
      passwordResetHash: ""
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

  handleCampaignChange = (event, index, value) => {
    // We send 0 when there is a campaign change, because presumably we start on page 1
    this.handleFilterChange({ campaignId: value });
  };

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false, passwordResetHash: "" });
  }

  handleSortByChanged = (event, index, sortBy) => {
    this.handleFilterChange({ sortBy });
  };

  handleFilterByChanged = (event, index, filterBy) => {
    this.handleFilterChange({ filterBy });
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
      <DropDownMenu
        value={this.props.location.query.campaignId || ALL_CAMPAIGNS}
        onChange={this.handleCampaignChange}
      >
        <MenuItem
          primaryText="All Campaigns"
          value={ALL_CAMPAIGNS}
          key={ALL_CAMPAIGNS}
        />
        {campaigns.campaigns.map(campaign => (
          <MenuItem
            value={campaign.id}
            primaryText={campaign.title}
            key={campaign.id}
          />
        ))}
      </DropDownMenu>
    );
  };

  renderSortBy = () => (
    <DropDownMenu
      value={this.props.location.query.sortBy || this.DEFAULT_SORT_BY_VALUE}
      onChange={this.handleSortByChanged}
    >
      {this.SORTS.map(sort => (
        <MenuItem
          value={sort.value}
          key={sort.value}
          primaryText={"Sort by " + sort.display}
        />
      ))}
    </DropDownMenu>
  );

  renderFilterBy = () => (
    <DropDownMenu
      value={this.props.location.query.filterBy || this.DEFAULT_FILTER_BY_VALUE}
      onChange={this.handleFilterByChanged}
    >
      {this.FILTERS.map(filter => (
        <MenuItem
          value={filter.value}
          key={filter.value}
          primaryText={"Filter by " + filter.display}
        />
      ))}
    </DropDownMenu>
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

    return (
      <div>
        <Paper className={css(styles.settings)} zDepth={3}>
          <div>
            {this.renderCampaignList()}
            {this.renderRoles()}
            {this.renderSortBy()}
            {this.renderFilterBy()}
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
        <FloatingActionButton
          {...dataTest("addPerson")}
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        {organizationData.organization && (
          <div>
            <Dialog
              title="Invite new texters"
              actions={[
                <FlatButton
                  {...dataTest("inviteOk")}
                  label="OK"
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={this.state.open}
              onRequestClose={this.handleClose}
            >
              <OrganizationJoinLink
                organizationUuid={organizationData.organization.uuid}
              />
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

export default loadData({ queries })(withRouter(AdminPersonList));
