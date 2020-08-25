import PropTypes from "prop-types";
import React, { Component } from "react";
import FlatButton from "material-ui/FlatButton";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import { inlineStyles, flexStyles } from "./AssignmentTexter/StyleControls";

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
        <FlatButton
          {...dataTest("send")}
          onTouchTap={this.props.onFinalTouchTap}
          disabled={this.props.disabled}
          label="Send"
          className={`${css(flexStyles.flatButton)} ${css(
            flexStyles.subSectionSendButton
          )}`}
          labelStyle={inlineStyles.flatButtonLabel}
          backgroundColor={
            this.props.disabled
              ? theme.colors.coreBackgroundColorDisabled
              : this.props.doneFirstClick
              ? theme.colors.darkBlue
              : theme.colors.coreBackgroundColor
          }
          hoverColor={
            this.props.doneFirstClick
              ? theme.colors.lightBlue
              : theme.colors.coreHoverColor
          }
          primary
        />
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
