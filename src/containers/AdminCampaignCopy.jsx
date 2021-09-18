import PropTypes from "prop-types";
import React from "react";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";

import { withRouter, Link } from "react-router";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";
import { getButtonProps } from "../components/utils";

export class AdminCampaignCopy extends React.Component {
  state = {
    copyCampaignId: null, // This is the ID of the most-recently created copy of the campaign.
    copyMessageOpen: false // This is true when the copy snackbar should be shown.
  };
  render() {
    return (
      <React.Fragment>
        <Button
          {...getButtonProps(this.props)}
          variant="outlined"
          key="copyCampaign"
          {...dataTest("copyCampaign")}
          onClick={async () => {
            let result = await this.props.mutations.copyCampaign(
              this.props.params.campaignId
            );
            this.setState({
              copyCampaignId: result.data.copyCampaign.id,
              copyMessageOpen: true
            });
          }}
          /**
           * this class is passed from the buttonGroup
           * and we need for button group styling.
           */
          className={this.props.className}
        >
          Copy Campaign
        </Button>
        <Snackbar
          open={this.state.copyMessageOpen}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          message="A new copy has been made."
          autoHideDuration={5000}
          onClose={() => {
            this.setState({ copyMessageOpen: false });
          }}
          action={
            <Button
              variant="contained"
              onClick={() => {
                this.props.router.push(
                  "/admin/" +
                    encodeURIComponent(this.props.organizationId) +
                    "/campaigns/" +
                    encodeURIComponent(this.state.copyCampaignId) +
                    "/edit"
                );
              }}
            >
              Edit
            </Button>
          }
        />
      </React.Fragment>
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
