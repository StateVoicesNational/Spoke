import React from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import UserEdit from "../../containers/UserEdit";
import { dataTest } from "../../lib/attributes";

const UserEditDialog = props => (
  <Dialog
    {...dataTest("editPersonDialog")}
    title="Edit user"
    modal={false}
    open={props.open}
    onRequestClose={props.requestClose}
    autoScrollBodyContent={true}
  >
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
  userId: PropTypes.number,
  updateUser: PropTypes.func,
  requestClose: PropTypes.func
};

export default UserEditDialog;
