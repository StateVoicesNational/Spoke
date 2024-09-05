import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import loadData from "./hoc/load-data";
import { gql } from "@apollo/client";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import { withRouter } from "react-router";
import Link from "@material-ui/core/Link";

export const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center"
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
    marginBottom: 15
  }
});

const Home = ({ data, router, mutations}) => {
  const [mounted, setMounted] = useState(false);

  const [state, setState] = useState({
    orgLessUser: false
  });

  if(!mounted) {
    const user = data.currentUser;
    if (user) {
      if (user.organizations.length > 0) {
        router.push(`/admin/${user.organizations[0].id}`);
      } else if (user.ownerOrganizations.length > 0) {
        router.push(`/admin/${user.ownerOrganizations[0].id}`);
      } else if (user.texterOrganizations.length > 0) {
        router.push(`/app/${user.texterOrganizations[0].id}`);
      } else {
        setState({ orgLessUser: true });
      }
    }
  };

  useEffect(() => {
    setMounted(true)
  },[]);

  // not sure if we need this anymore -- only for new organizations
  const handleOrgInviteClick = async e => {
    if (
      !window.SUPPRESS_SELF_INVITE ||
      window.SUPPRESS_SELF_INVITE === "undefined"
    ) {
      e.preventDefault();
      const newInvite = await mutations.createInvite({
        is_valid: true
      });
      if (newInvite.errors) {
        alert("There was an error creating your invite");
        throw new Error(newInvite.errors);
      } else {
        router.push(
          `/login?nextUrl=/invite/${newInvite.data.createInvite.hash}`
        );
      }
    }
  };

  const renderContent = () => {
    if (state.orgLessUser) {
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
            <Link id="logout" href="/logout-callback">
              Logout
            </Link>
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
          <Link id="login" href="/login" onClick={handleOrgInviteClick}>
            Login and get started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={css(styles.container)}>
      <div className={css(styles.logoDiv)}>
        <img
          src="https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg"
          className={css(styles.logoImg)}
          alt="Spoke Logo"
        />
      </div>
      <div className={css(styles.content)}>{renderContent()}</div>
    </div>
  );
}

Home.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  data: PropTypes.object
};

// used in testing, otherwise unused
export const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          organizations: organizations(role: "ADMIN") {
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

export const mutations = {
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

const EnhancedHome = withRouter(
  loadData({ queries, mutations })(Home)
);

export default EnhancedHome;
