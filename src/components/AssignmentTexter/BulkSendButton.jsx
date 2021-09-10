import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import Button from "@material-ui/core/Button";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 20
  }
});

export default class BulkSendButton extends Component {
  state = {
    isSending: false
  };

  sendMessages = async () => {
    this.setState({ isSending: true });
    this.props.setDisabled(true);
    await this.props.bulkSendMessages(this.props.assignment.id);
    this.setState({ isSending: false });
    this.props.setDisabled(false);
    this.props.onFinishContact();
  };

  render() {
    return (
      <div className={css(styles.container)}>
        <Button
          onClick={this.sendMessages}
          disabled={this.state.isSending}
          color="primary"
        >
          {this.state.isSending
            ? "Sending..."
            : `Send Bulk (${window.BULK_SEND_CHUNK_SIZE})`}
        </Button>
      </div>
    );
  }
}

BulkSendButton.propTypes = {
  assignment: PropTypes.object,
  onFinishContact: PropTypes.function,
  bulkSendMessages: PropTypes.function,
  setDisabled: PropTypes.function
};
