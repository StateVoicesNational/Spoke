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

const DisplayCostError = () => {
  return (
    <div>
      Warning: The campaign cost calculator service-manager extension is
      misconfigured. <br />
      Please ask your system administrator to review the Spoke .env file.
    </div>
  );
};

const DisplayCostData = props => {
  const { outboundcost, inboundcost, totalcost } = props.data;
  return (
    <div>
      Outbound cost: {outboundcost} <br />
      Inbound cost: {inboundcost} <br />
      Total cost: {totalcost} <br />
      NB: these costs estimates may be <em>very slightly</em> inaccurate and do
      not include phone rental costs.
    </div>
  );
};
export class CampaignStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      error,
      ...campaignCosts
    } = this.props.serviceManagerInfo.data.campaignCosts;

    let content;
    if (error) {
      content = <DisplayCostError />;
    } else {
      content = <DisplayCostData data={campaignCosts} />;
    }

    return (
      <div>
        <div className={css(styles.header)}>Campaign Costs</div>
        {content}
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
