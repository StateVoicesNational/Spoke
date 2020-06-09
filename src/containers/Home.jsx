import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import { withRouter } from "react-router";

const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center",
    color: theme.colors.lightGray
  },
  content: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  logoDiv: {
    ...theme.components.logoDiv
  },
  logoImg: {
    width: 120,
    ...theme.components.logoImg
  },
  header: {
    ...theme.text.header,
    marginBottom: 15,
    color: theme.colors.white
  },
  link_dark_bg: {
    ...theme.text.link_dark_bg
  }
});

class Home extends React.Component {
  state = {
    orgLessUser: false
  };

  componentWillMount() {
    const user = this.props.data.currentUser;
    if (user) {
      if (user.adminOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.adminOrganizations[0].id}`);
      } else if (user.ownerOrganizations.length > 0) {
        this.props.router.push(`/admin/${user.ownerOrganizations[0].id}`);
      } else if (user.texterOrganizations.length > 0) {
        this.props.router.push(`/app/${user.texterOrganizations[0].id}`);
      } else {
        this.setState({ orgLessUser: true });
      }
    }
  }

  // not sure if we need this anymore -- only for new organizations
  handleOrgInviteClick = async e => {
    if (
      !window.SUPPRESS_SELF_INVITE ||
      window.SUPPRESS_SELF_INVITE === "undefined"
    ) {
      e.preventDefault();
      const newInvite = await this.props.mutations.createInvite({
        is_valid: true
      });
      if (newInvite.errors) {
        alert("There was an error creating your invite");
        throw new Error(newInvite.errors);
      } else {
        // alert(newInvite.data.createInvite.id)
        this.props.router.push(
          `/login?nextUrl=/invite/${newInvite.data.createInvite.hash}`
        );
      }
    }
  };

  renderContent() {
    if (this.state.orgLessUser) {
      return (
        <div>
          <div className={css(styles.header)}>
            You currently aren't part of any organization!
          </div>
          <div>
            If you got sent a link by somebody to start texting, ask that person
            to send you the link to join their organization. Then, come back
            here and start texting!
            <br />
            <br />
            <a
              id="logout"
              className={css(styles.link_dark_bg)}
              href="/logout-callback"
            >
              Logout
            </a>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className={css(styles.header)}>
          Spoke is a new way to run campaigns using text messaging.
        </div>
        <div>
          <a
            id="login"
            className={css(styles.link_dark_bg)}
            href="/login"
            onClick={this.handleOrgInviteClick}
          >
            Login and get started
          </a>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.logoDiv)}>
          <img
            src="https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg"
            className={css(styles.logoImg)}
          />
        </div>
        <div className={css(styles.content)}>{this.renderContent()}</div>
      </div>
    );
  }
}

Home.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  data: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          adminOrganizations: organizations(role: "ADMIN") {
            id
          }
          superVolOrganizations: organizations(role: "SUPERVOLUNTEER") {
            id
          }
          ownerOrganizations: organizations(role: "OWNER") {
            id
          }
          texterOrganizations: organizations(role: "TEXTER") {
            id
          }
        }
      }
    `,
    options: ownProps => ({
      fetchPolicy: "network-only"
    })
  }
};

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

export default loadData({ queries, mutations })(withRouter(Home));
