import PropTypes from "prop-types";
import React from "react";
import TopNav from "../components/TopNav";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import { withRouter, Link } from "react-router";
import ContentAdd from "material-ui/svg-icons/content/add";
import DataTables from "material-ui-datatables";
import FloatingActionButton from "material-ui/FloatingActionButton";

import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  fieldContainer: {
    background: theme.colors.white,
    padding: "15px",
    width: "256px"
  },
  loginPage: {
    display: "flex",
    "justify-content": "center",
    "align-items": "flex-start",
    height: "100vh",
    "padding-top": "10vh",
    background: theme.colors.veryLightGray
  },
  button: {
    border: "none",
    background: theme.colors.lightGray,
    color: theme.colors.darkGreen,
    padding: "16px 16px",
    "font-size": "14px",
    "text-transform": "uppercase",
    cursor: "pointer",
    width: "50%",
    transition: "all 0.3s",
    ":disabled": {
      background: theme.colors.white,
      cursor: "default",
      color: theme.colors.green
    }
  },
  header: {
    ...theme.text.header,
    color: theme.colors.coreBackgroundColor,
    "text-align": "center",
    "margin-bottom": 0
  }
});

class AdminOrganizationsDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: "login"
    };

    this.isLocalAdminOrganizationsDashboard =
      window.PASSPORT_STRATEGY === "local";
  }

  componentDidMount = () => {
    const {
      location: {
        query: { nextUrl }
      }
    } = this.props;

    if (!this.isLocalAdminOrganizationsDashboard) {
      window.AuthService.login(nextUrl);
      return;
    }

    if (nextUrl && nextUrl.includes("reset")) {
      this.setState({ active: "reset" });
    }
  };

  handleClick = e => {
    this.setState({ active: e.target.name });
  };

  handleCreateOrgClick = async e => {
    e.preventDefault();
    const newInvite = await this.props.mutations.createInvite({
      is_valid: true
    });
    if (newInvite.errors) {
      alert("There was an error creating your invite");
      throw new Error(newInvite.errors);
    } else {
      this.props.router.push(
        `/addOrganization/${newInvite.data.createInvite.hash}`
      );
    }
  };

  sortFunc(key) {
    const sorts = {
      id: (a, b) => b.id - a.id,
      name: (a, b) => (b.name > a.name ? 1 : -1),
      campaignsCount: (a, b) => b.id - a.id,
      numTextsInLastDay: (a, b) => b.id - a.id
    };
    return sorts[key];
  }

  renderActionButton() {
    return (
      <FloatingActionButton
        style={theme.components.floatingButton}
        onTouchTap={this.handleCreateOrgClick}
      >
        <ContentAdd />
      </FloatingActionButton>
    );
  }

  render() {
    // Note: when adding new columns, make sure to update the sortFunc to include that column
    var columns = [
      {
        key: "id",
        label: "id",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        style: {
          width: "5em"
        },
        render: (columnKey, organizations) => {
          return (
            <div style={{ margin: "6px 0" }}>
              <Link target="_blank" to={`/admin/${organizations.id}/campaigns`}>
                {columnKey}
              </Link>
            </div>
          );
        }
      },
      // note that 'active' is defined as 'not archived'.
      // campaigns that have not yet started are included here.
      // is this what we want?
      {
        key: "campaignsCount",
        label: "Number of Active Campaigns",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      {
        key: "numTextsInLastDay",
        label: "Number of texts in last day",
        sortable: true,
        style: {
          width: "5em"
        }
      }
    ];

    if (!this.props.userData.currentUser.is_superadmin) {
      return (
        <div>You do not have access to the Manage Organizations page.</div>
      );
    }

    return (
      <div>
        <TopNav title={"Manage Organizations"} />
        <div className={css(styles.loginPage)}>
          <DataTables
            key={"adminOrganizations"}
            data={this.props.data.organizations}
            columns={columns}
            onSortOrderChange={(key, direction) => {
              this.props.data.organizations.sort(this.sortFunc(key));
              if (direction === "desc") {
                this.props.data.organizations.reverse();
              }
            }}
          />
        </div>
        {this.renderActionButton()}
      </div>
    );
  }
}

const mutations = {
  createInvite: ownProps => invite => ({
    mutation: gql`
      mutation createInvite($invite: InviteInput!) {
        createInvite(invite: $invite) {
          hash
        }
      }
    `,
    variables: { invite }
  })
};

AdminOrganizationsDashboard.propTypes = {
  location: PropTypes.object,
  data: PropTypes.object,
  router: PropTypes.object,
  mutations: PropTypes.object,
  userData: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getOrganizations {
        organizations {
          id
          name
          campaignsCount
          numTextsInLastDay
        }
      }
    `,
    options: ownProps => ({
      fetchPolicy: "network-only"
    })
  },
  userData: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          is_superadmin
        }
      }
    `,
    options: () => ({
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries, mutations })(
  withRouter(AdminOrganizationsDashboard)
);
