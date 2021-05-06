import React from "react";
import PropTypes from "prop-types";

import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";

import UserEdit from "../../containers/UserEdit";
import { dataTest } from "../../lib/attributes";

const UserEditDialog = props => (
  <Dialog
    {...dataTest("editPersonDialog")}
    open={props.open}
    onClose={props.requestClose}
    scroll="paper"
  >
    <DialogTitle>Edit user ({props.userId})</DialogTitle>
    <UserEdit
      organizationId={props.organizationId}
      userId={props.userId}
      onRequestClose={props.updateUser}
      onCancel={props.onCancel}
    />
  </Dialog>
);

UserEditDialog.propTypes = {
  open: PropTypes.bool,
  organizationId: PropTypes.string,
  userId: PropTypes.string,
  updateUser: PropTypes.func,
  requestClose: PropTypes.func
};

export default UserEditDialog;
