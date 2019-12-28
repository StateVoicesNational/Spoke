import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import OrganizationJoinLink from "../components/OrganizationJoinLink";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import ContentAdd from "material-ui/svg-icons/content/add";
import Dialog from "material-ui/Dialog";
import theme from "../styles/theme";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";
import PeopleList from "../components/PeopleList";
import { StyleSheet, css } from "aphrodite";
import Search from "../components/Search";

const styles = StyleSheet.create({
  settings: {
    display: "flex"
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
      sortBy: this.FIRST_NAME_SORT.value,
      searchString: ""
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

  handleFilterChange = campaignId => {
    const query = "?" + (campaignId ? `campaignId=${campaignId}` : "");
    this.props.router.push(
      `/admin/${this.props.params.organizationId}/people${query}`
    );
  };

  handleCampaignChange = (event, index, value) => {
    // We send 0 when there is a campaign change, because presumably we start on page 1
    this.handleFilterChange(value);
  };

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false, passwordResetHash: "" });
  }

  handleSortByChanged = (event, index, sortBy) => {
    this.setState({ sortBy });
  };

  handleSearchRequested = searchString => {
    this.setState({ searchString });
  };

  renderCampaignList = () => {
    const {
      organizationData: { organization }
    } = this.props;
    const campaigns = organization ? organization.campaigns : { campaigns: [] };
    return (
      <DropDownMenu
        value={this.props.location.query.campaignId}
        onChange={this.handleCampaignChange}
      >
        <MenuItem primaryText="All Campaigns" />
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
    <DropDownMenu value={this.state.sortBy} onChange={this.handleSortByChanged}>
      {this.SORTS.map(sort => (
        <MenuItem
          value={sort.value}
          key={sort.value}
          primaryText={"Sort by " + sort.display}
        />
      ))}
    </DropDownMenu>
  );

  render() {
    const { organizationData } = this.props;
    const {
      userData: { currentUser }
    } = this.props;

    return (
      <div>
        <div className={css(styles.settings)}>
          {this.renderCampaignList()}
          {this.renderSortBy()}
          <Search
            onSearchRequested={this.handleSearchRequested}
            searchString={this.state.searchString}
            onCancelSearch={this.handleCancelSearch}
          />
        </div>
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
          sortBy={this.state.sortBy}
          searchString={this.state.searchString}
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

const mapQueriesToProps = ({ ownProps }) => ({
  userData: {
    query: gql`
      query getCurrentUserAndRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          uuid
          campaigns(campaignsFilter: { isArchived: false }) {
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
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
});

export default loadData(withRouter(AdminPersonList), { mapQueriesToProps });
