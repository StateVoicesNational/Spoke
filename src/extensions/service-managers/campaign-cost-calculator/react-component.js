/* eslint no-console: 0 */
import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, css } from "aphrodite";
import theme from "../../../styles/theme";

export const styles = StyleSheet.create({
  header: {
    ...theme.text.header
  }
});
export class CampaignStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("campaign-cost-calculator CampaignStats", this.props);
    const {
      outboundCost,
      inboundCost,
      totalCost
    } = this.props.serviceManagerInfo.data.campaignCosts;
    return (
      <div>
        <div className={css(styles.header)}>Campaign Costs</div>
        <div>
          Outbound cost: {outboundCost} <br />
          Inbound cost: {inboundCost} <br />
          Total cost: {totalCost} <br />
          NB: these costs estimates may be <em>very slightly</em> inaccurate and
          do not include phone rental costs.
        </div>
      </div>
    );
  }
}

CampaignStats.propTypes = {
  user: PropTypes.object,
  campaign: PropTypes.object,
  serviceManagerInfo: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
