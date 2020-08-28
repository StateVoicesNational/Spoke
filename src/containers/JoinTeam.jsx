import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  greenBox: {
    ...theme.layouts.greenBox
  }
});

class JoinTeam extends React.Component {
  state = {
    errors: null
  };
  async componentWillMount() {
    let organization = null;
    let campaign = null;
    try {
      organization = await this.props.mutations.joinOrganization(
        this.props.location.search
      );
    } catch (err) {
      console.log("error joining", err);
      const texterMessage = (err &&
        err.message &&
        err.message.match(/(Sorry,.+)$/)) || [
        0,
        "Something went wrong trying to join this organization. Please contact your administrator."
      ];
      this.setState({
        errors: texterMessage[1]
      });
    }

    if (organization) {
      this.props.router.push(`/app/${organization.data.joinOrganization.id}`);
    }
  }

  renderErrors() {
    if (this.state.errors) {
      return <div className={css(styles.greenBox)}>{this.state.errors}</div>;
    }
    return <div />;
  }

  render() {
    return <div>{this.renderErrors()}</div>;
  }
}

JoinTeam.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  location: PropTypes.object
};

const mutations = {
  joinOrganization: ownProps => queryParams => ({
    mutation: gql`
      mutation joinOrganization(
        $organizationUuid: String!
        $campaignId: String
        $queryParams: String
      ) {
        joinOrganization(
          organizationUuid: $organizationUuid
          campaignId: $campaignId
          queryParams: $queryParams
        ) {
          id
        }
      }
    `,
    variables: {
      organizationUuid: ownProps.params.organizationUuid,
      campaignId: ownProps.params.campaignId,
      queryParams: queryParams
    }
  })
};

export default loadData({ mutations })(withRouter(JoinTeam));
