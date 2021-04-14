import PropTypes from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import { withRouter, Link } from "react-router";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";

export class AdminCampaignCopy extends React.Component {
  state = {
    copyCampaignId: null, // This is the ID of the most-recently created copy of the campaign.
    copyMessageOpen: false // This is true when the copy snackbar should be shown.
  };
  render() {
    return (
      <div style={{ display: "inline-block" }}>
        <RaisedButton
          key="copyCampaign"
          {...dataTest("copyCampaign")}
          label="Copy Campaign"
          onClick={async () => {
            let result = await this.props.mutations.copyCampaign(
              this.props.campaignId
            );
            this.setState({
              copyCampaignId: result.data.copyCampaign.id,
              copyMessageOpen: true
            });
          }}
        />
        <Snackbar
          open={this.state.copyMessageOpen}
          message="A new copy has been made."
          action="Edit"
          onActionClick={() => {
            this.props.router.push(
              "/admin/" +
                encodeURIComponent(this.props.organizationId) +
                "/campaigns/" +
                encodeURIComponent(this.state.copyCampaignId) +
                "/edit"
            );
          }}
          autoHideDuration={5000}
          onRequestClose={() => {
            this.setState({ copyMessageOpen: false });
          }}
        />
      </div>
    );
  }
}

const mutations = {
  copyCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation copyCampaign($campaignId: String!) {
        copyCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
  })
};

AdminCampaignCopy.propTypes = {
  mutations: PropTypes.object,
  organizationId: PropTypes.string,
  campaignId: PropTypes.string,
  router: PropTypes.object
};

export default loadData({ mutations })(withRouter(AdminCampaignCopy));
