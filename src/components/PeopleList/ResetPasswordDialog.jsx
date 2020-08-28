import React from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import PasswordResetLink from "../../components/PasswordResetLink";
import FlatButton from "material-ui/FlatButton";
import { dataTest } from "../../lib/attributes";

const ResetPasswordDialog = props => (
  <Dialog
    title="Reset user password"
    actions={[
      <FlatButton
        {...dataTest("passResetOK")}
        label="OK"
        primary
        onTouchTap={props.requestClose}
      />
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
