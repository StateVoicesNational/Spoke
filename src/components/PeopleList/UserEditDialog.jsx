import React from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import UserEdit from "../../containers/UserEdit";
import { dataTest } from "../../lib/attributes";
import { ApolloProvider } from "react-apollo";
import ApolloClientSingleton from "../../network/apollo-client-singleton";

const UserEditDialog = props => (
  <Dialog
    {...dataTest("editPersonDialog")}
    title={`Edit user (${props.userId})`}
    modal={false}
    open={props.open}
    onRequestClose={props.requestClose}
    autoScrollBodyContent={true}
  >
    <ApolloProvider client={ApolloClientSingleton}>
      <UserEdit
        organizationId={props.organizationId}
        userId={props.userId}
        onRequestClose={props.updateUser}
        onCancel={props.onCancel}
      />
    </ApolloProvider>
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
