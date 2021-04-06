import React from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import PasswordResetLink from "../../components/PasswordResetLink";
import Button from "@material-ui/core/Button";
import { dataTest } from "../../lib/attributes";

const ResetPasswordDialog = props => (
  <Dialog
    title="Reset user password"
    actions={[
      <Button
        {...dataTest("passResetOK")}
        color="primary"
        onClick={props.requestClose}
      >
        OK
      </Button>
    ]}
    modal={false}
    open={props.open}
    onRequestClose={props.requestClose}
  >
    <PasswordResetLink passwordResetHash={props.passwordResetHash} />
  </Dialog>
);

ResetPasswordDialog.propTypes = {
  open: PropTypes.bool,
  requestClose: PropTypes.func,
  passwordResetHash: PropTypes.string
};

export default ResetPasswordDialog;
