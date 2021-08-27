import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import Chip from "@material-ui/core/Chip";
import CloseIcon from "@material-ui/icons/Close";

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
    {props.campaigns.length > 0 && (
      <Chip
        style={{ backgroundColor: "#FFC0CB", ...styles.chip }}
        key={0}
        onClick={props.onClear}
        label="Clear campaigns"
      />
    )}
    {props.campaigns.map((campaign, index) => (
      <Chip
        style={styles.chip}
        key={`${campaign.key}${index}`}
        onDelete={() => props.onDeleteRequested(campaign.key)}
        deleteIcon={<CloseIcon />}
        label={campaign.text}
      />
    ))}
  </div>
);

SelectedCampaigns.propTypes = {
  campaigns: PropTypes.array.isRequired,
  onDeleteRequested: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default SelectedCampaigns;
