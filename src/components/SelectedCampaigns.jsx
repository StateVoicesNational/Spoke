import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import Chip from "material-ui/Chip";

const ssStyles = StyleSheet.create({
  container: {
    display: "flex",
    flexWrap: "wrap"
  }
});

const styles = {
  chip: {
    margin: 6
  }
};

const SelectedCampaigns = props => (
  <div className={css(ssStyles.container)}>
    {props.campaigns.length ? (
      <Chip
        style={styles.chip}
        key={0}
        onClick={props.onClear}
        backgroundColor="#FFC0CB"
      >
        Clear campaigns
      </Chip>
    ) : null}
    {props.campaigns.map(campaign => (
      <Chip
        style={styles.chip}
        key={campaign.key}
        onRequestDelete={() => props.onDeleteRequested(campaign.key)}
      >
        {campaign.text}
      </Chip>
    ))}
  </div>
);

SelectedCampaigns.propTypes = {
  campaigns: PropTypes.array.isRequired,
  onDeleteRequested: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default SelectedCampaigns;
