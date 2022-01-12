/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";

export class CampaignStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("campaign-cost-calculator CampaignStats", this.props);
    const { outboundCost, inboundCost, totalCost } =
      this.props.serviceManagerInfo && this.props.serviceManagerInfo.data;
    return (
      <div>
        Outbound cost: {outboundCost} <br />
        Inbound cost: {inboundCost} <br />
        Total cost: {totalCost}
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
