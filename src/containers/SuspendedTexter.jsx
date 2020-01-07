import PropTypes from "prop-types";
import React from "react";

import { withRouter } from "react-router";

import ErrorOutline from "material-ui/svg-icons/alert/error-outline";

import Empty from "../components/Empty";
import loadData from "./hoc/load-data";

import gql from "graphql-tag";

const SuspendedTexter = props => {
  if (!props.currentUser.errors) {
    console.log(props.currentUser);
    props.router.push(`/app/${props.organizationId}/todos`);
    return null;
  }

  return (
    <div>
      <Empty
        title="Your account is suspended. Contact the moderator in Slack."
        icon={<ErrorOutline />}
      />
    </div>
  );
};

SuspendedTexter.propTypes = {
  organizationId: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  router: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  currentUser: {
    query: gql`
      query Q($organizationId: String!, $role: String!) {
        currentUserWithAccess(organizationId: $organizationId, role: $role) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      role: "TEXTER"
    },
    forceFetch: true
  }
});

export default loadData(withRouter(SuspendedTexter), { mapQueriesToProps });
