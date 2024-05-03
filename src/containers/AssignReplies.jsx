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

class AssignReplies extends React.Component {
  state = {
    errors: null
  };

  async componentWillMount() {
    console.log("Props",this.props);
    try {
      
      const organizationId = (await this.props.mutations.dynamicReassign(
        this.props.params.joinToken,
        this.props.params.campaignId
      )).data.dynamicReassign;
      console.log("ID:", organizationId);

    this.props.router.push(`/app/${organizationId}`);
    } catch (err) {
      console.log("error assigning replies", err);
      const texterMessage = (err &&
        err.message &&
        err.message.match(/(Sorry,.+)$/)) || [
        0,
        "Something went wrong trying to assign replies. Please contact your administrator."
      ];
      this.setState({
        errors: texterMessage[1]
      });
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

AssignReplies.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  params: PropTypes.object,
  campaign: PropTypes.object
};

export const dynamicReassignMutation = gql`
  mutation dynamicReassign(
    $joinToken: String!
    $campaignId: String!
  ) {
    dynamicReassign(
      joinToken: $joinToken
      campaignId: $campaignId
    )
  }
`;

const mutations = {
  dynamicReassign: ownProps => (
    joinToken,
    campaignId
  ) => ({
    mutation: dynamicReassignMutation,
    variables: {
      joinToken,
      campaignId
    }
  })
};

export default loadData({ mutations })(withRouter(AssignReplies));
