import PropTypes from "prop-types";
import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 24
  }
});
class SendButton extends Component {
  render() {
    return (
      <div className={css(styles.container)}>
        <Button
          {...dataTest("send")}
          onClick={this.props.onFinalTouchTap}
          disabled={this.props.disabled}
          color={this.props.doneFirstClick ? "secondary" : "primary"}
          variant="contained"
        >
          Send
        </Button>
      </div>
    );
  }
}

SendButton.propTypes = {
  onFinalTouchTap: PropTypes.func,
  disabled: PropTypes.bool,
  doneFirstClick: PropTypes.bool
};

export default SendButton;
