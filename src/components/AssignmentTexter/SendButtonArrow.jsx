import PropTypes from "prop-types";
import React, { Component } from "react";

import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";

import { StyleSheet, css } from "aphrodite";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 20
  },
  icon: {
    color: "rgb(83, 180, 119)",
    width: 40,
    height: 40
  },
  arrowButton: {
    "@media(min-width: 450px)": {
      display: "none !important"
    },
    "@media(max-width: 450px)": {
      display: "block !important"
    },
    position: "absolute",
    right: 2,
    bottom: 125,
    zIndex: 100
  }
});
class SendButtonArrow extends Component {
  handleTouchTap = () => {
    const { onClick } = this.props;
    return onClick();
  };

  render() {
    return (
      <div className={css(styles.container)}>
        <IconButton
          className={css(styles.arrowButton)}
          onClick={this.handleTouchTap}
          disabled={this.props.disabled}
          color="primary"
        >
          <ArrowForwardIcon className={css(styles.icon)} />
        </IconButton>
      </div>
    );
  }
}

SendButtonArrow.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool
};

export default SendButtonArrow;
