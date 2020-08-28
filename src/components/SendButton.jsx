import PropTypes from "prop-types";
import React, { Component } from "react";
import RaisedButton from "material-ui/RaisedButton";
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
        <RaisedButton
          {...dataTest("send")}
          onTouchTap={this.props.onFinalTouchTap}
          disabled={this.props.disabled}
          label="Send"
          primary
        />
      </div>
    );
  }
}

SendButton.propTypes = {
  onFinalTouchTap: PropTypes.func,
  disabled: PropTypes.bool
};

export default SendButton;
