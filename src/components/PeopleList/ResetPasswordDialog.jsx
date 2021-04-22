import React from "react";
import PropTypes from "prop-types";

import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import PasswordResetLink from "../../components/PasswordResetLink";
import Button from "@material-ui/core/Button";
import { dataTest } from "../../lib/attributes";

const ResetPasswordDialog = props => (
  <Dialog open={props.open} onClose={props.requestClose}>
    <DialogTitle>Reset user password</DialogTitle>
    <DialogContent>
      <PasswordResetLink passwordResetHash={props.passwordResetHash} />
    </DialogContent>
    <DialogActions>
      <Button
        {...dataTest("passResetOK")}
        color="primary"
        onClick={props.requestClose}
      >
        OK
      </Button>
    </DialogActions>
  </Dialog>
);

ResetPasswordDialog.propTypes = {
  open: PropTypes.bool,
  requestClose: PropTypes.func,
  passwordResetHash: PropTypes.string
};

export default ResetPasswordDialog;
