import React from "react";
import { withRouter } from "react-router";
import { gql } from "@apollo/client";
import loadData from "../containers/hoc/load-data";
import withSetTheme from "../containers/hoc/withSetTheme";

const OrganizationWrapper = ({ children, ...props }) => {
  return <React.Fragment>{children}</React.Fragment>;
};

const queries = {
  organization: {
    query: gql`
      query getOrganization($id: String!) {
        organization(id: $id) {
          id
          theme
          tags {
            id
            name
          }
        }
      }
    `,
    options: ownProps => {
      return {
        variables: {
          id: ownProps.params.organizationId
        },
        fetchPolicy: "network-only"
      };
    }
  }
};

export const operations = { queries };

class EnhancedOrganizationWrapper extends React.Component {
  componentDidMount() {
    this.props.setTheme(this.props.organization.organization.theme);
  }

  componentWillUnmount() {
    this.props.setTheme(undefined);
  }

  render() {
    return <OrganizationWrapper {...this.props} />;
  }
}

export default loadData(operations)(
  withSetTheme(withRouter(EnhancedOrganizationWrapper))
);
