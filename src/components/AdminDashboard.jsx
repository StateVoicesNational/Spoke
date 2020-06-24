import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import { hasRole } from "../lib";
import TopNav from "./TopNav";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import loadData from "../containers/hoc/load-data";
import AdminNavigation from "../containers/AdminNavigation";
const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container
  },
  sidebar: {
    minHeight: "calc(100vh - 56px)"
  },
  content: {
    ...theme.layouts.multiColumn.flexColumn,
    paddingLeft: "2rem",
    paddingRight: "2rem",
    margin: "24px auto"
  }
});

class AdminDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMenu: true
    };

    this.handleToggleMenu = this.handleToggleMenu.bind(this);
  }
  urlFromPath(path) {
    const organizationId = this.props.params.organizationId;
    return `/admin/${organizationId}/${path}`;
  }

  async handleToggleMenu() {
    await this.setState({ showMenu: !this.state.showMenu });
  }

  renderNavigation(sections) {
    const organizationId = this.props.params.organizationId;

    if (!organizationId) {
      return "";
    }

    return (
      <div className={css(styles.sidebar)}>
        <AdminNavigation
          onToggleMenu={this.handleToggleMenu}
          showMenu={this.state.showMenu}
          organizationId={organizationId}
          sections={sections}
        />
      </div>
    );
  }

  render() {
    const { location, children, params } = this.props;
    const { roles } = this.props.data.currentUser;

    // HACK: Setting params.adminPerms helps us hide non-supervolunteer functionality
    params.adminPerms = hasRole("ADMIN", roles || []);

    let sections = [
      {
        name: "Campaigns",
        path: "campaigns",
        role: "SUPERVOLUNTEER"
      },
      {
        name: "People",
        path: "people",
        role: "ADMIN"
      },
      {
        name: "Opt-outs",
        path: "optouts",
        role: "ADMIN"
      },
      {
        name: "Message Review",
        path: "incoming",
        role: "SUPERVOLUNTEER"
      },
      {
        name: "Tags",
        path: "tags",
        role: "SUPERVOLUNTEER"
      },
      {
        name: "Settings",
        path: "settings",
        role: "SUPERVOLUNTEER"
      },
      {
        name: "Phone Numbers",
        path: "phone-numbers",
        role: "OWNER"
      }
    ];

    if (window.EXPERIMENTAL_TAGS === false) {
      sections = sections.filter(section => section.name !== "Tags");
    }

    if (!this.props.data.organization.phoneInventoryEnabled) {
      sections = sections.filter(section => section.name !== "Phone Numbers");
    }

    let currentSection = sections.filter(section =>
      location.pathname.match(`/${section.path}`)
    );

    currentSection = currentSection.length > 0 ? currentSection.shift() : null;
    const title = currentSection ? currentSection.name : "Admin";
    const backToURL =
      currentSection &&
      location.pathname.split("/").pop() !== currentSection.path
        ? this.urlFromPath(currentSection.path)
        : null;

    return (
      <div>
        <TopNav
          title={title}
          backToURL={backToURL}
          orgId={params.organizationId}
        />
        <div className={css(styles.container)}>
          {this.renderNavigation(sections.filter(s => hasRole(s.role, roles)))}
          <div className={css(styles.content)}>{children}</div>
        </div>
      </div>
    );
  }
}

AdminDashboard.propTypes = {
  router: PropTypes.object,
  params: PropTypes.object,
  children: PropTypes.object,
  location: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCurrentUserRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
        organization(id: $organizationId) {
          name
          phoneInventoryEnabled
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      }
    })
  }
};

export default loadData({ queries })(withRouter(AdminDashboard));
