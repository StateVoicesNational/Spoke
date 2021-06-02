import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 20
  }
});

export default class ConfirmButton extends Component {
  state = {
    showConfirmationDialog: false
  };

  toggleConfirmationDialog = () => {
    this.setState({
      showConfirmationDialog: !this.state.showConfirmationDialog
    });
  };

  handleConfirm = async () => {
    await this.props.onConfirm();
    this.toggleConfirmationDialog();
  };

  render() {
    const actions = [
      <Button variant="outlined" onClick={this.toggleConfirmationDialog}>
        No
      </Button>,
      <Button variant="outlined" onClick={this.handleConfirm}>
        Yes
      </Button>
    ];

    return (
      <div className={css(styles.container)}>
        <Button
          variant="contained"
          color="primary"
          onClick={this.toggleConfirmationDialog}
        >
          {this.props.label}
        </Button>
        <Dialog actions={actions} open={this.state.showConfirmationDialog}>
          <DialogTitle>{this.props.label}</DialogTitle>
          Are you sure?
        </Dialog>
      </div>
    );
  }
}

ConfirmButton.propTypes = {
  onConfirm: PropTypes.function,
  label: PropTypes.string
};
