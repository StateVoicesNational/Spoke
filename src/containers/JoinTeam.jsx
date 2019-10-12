import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import wrapMutations from "./hoc/wrap-mutations";
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
      organization = await this.props.mutations.joinOrganization();
    } catch (ex) {
      this.setState({
        errors:
          "Something went wrong trying to join this organization. Please contact your administrator."
      });
    }

    if (this.props.params.campaignId) {
      try {
        campaign = await this.props.mutations.assignUserToCampaign();
      } catch (ex) {
        this.setState({
          errors:
            "Something went wrong trying to join this campaign. Please contact your administrator."
        });
      }
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
  router: PropTypes.object
};

const mapMutationsToProps = ({ ownProps }) => ({
  joinOrganization: () => ({
    mutation: gql`
      mutation joinOrganization($organizationUuid: String!) {
        joinOrganization(organizationUuid: $organizationUuid) {
          id
        }
      }
    `,
    variables: { organizationUuid: ownProps.params.organizationUuid }
  }),
  assignUserToCampaign: () => ({
    mutation: gql`
      mutation assignUserToCampaign(
        $organizationUuid: String!
        $campaignId: String!
      ) {
        assignUserToCampaign(
          organizationUuid: $organizationUuid
          campaignId: $campaignId
        ) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.params.campaignId,
      organizationUuid: ownProps.params.organizationUuid
    }
  })
});

export default loadData(wrapMutations(withRouter(JoinTeam)), {
  mapMutationsToProps
});
