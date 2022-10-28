import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import Button from "@material-ui/core/Button";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "block",
    width: "25ex",
    marginLeft: "auto",
    marginRight: "auto"
  }
});

export default class BulkSendButton extends Component {
  state = {
    isSending: false
  };

  sendMessages = async () => {
    let sentMessages = 0;

    this.setState({ isSending: true });
    this.props.setDisabled(true);

    console.log(`Start bulk sending messages ${new Date()}`);
    while (sentMessages < window.BULK_SEND_CHUNK_SIZE) {
      const res = await this.props.bulkSendMessages(this.props.assignment.id);

      // Check if all messages have been sent
      if (!res.data.bulkSendMessages.length) {
        break;
      }

      // Print progress to console
      sentMessages += res.data.bulkSendMessages.length;
      console.log(`Bulk sent ${sentMessages} messages ${new Date()}`);
    }
    this.props.refreshData();
    console.log(`Finish bulk sending messages ${new Date()}`);

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
          variant="contained"
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
  onFinishContact: PropTypes.func,
  bulkSendMessages: PropTypes.func,
  refreshData: PropTypes.func,
  setDisabled: PropTypes.func
};
