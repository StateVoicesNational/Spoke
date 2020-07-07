import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import yup from "yup";
import Dialog from "material-ui/Dialog";
import RaisedButton from "material-ui/RaisedButton";
import { StyleSheet, css } from "aphrodite";
import apolloClient from "../network/apollo-client-singleton";

import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginTop: 25
  },
  buttons: {
    display: "flex",
    marginTop: 25
  },
  fields: {
    display: "flex",
    flexDirection: "column"
  },
  submit: {
    marginRight: 8
  },
  cancel: {
    marginTop: 15
  }
});

const fetchUser = async (organizationId, userId) =>
  apolloClient.query({
    query: gql`
      query getEditedUser($organizationId: ID!, $userId: Int!) {
        user(organizationId: $organizationId, userId: $userId) {
          id
          firstName
          email
          lastName
          alias
          cell
          extra
        }
      }
    `,
    variables: { organizationId, userId }
  });

const fetchOrg = async organizationId =>
  apolloClient.query({
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          profileFields {
            name
            label
          }
        }
      }
    `,
    variables: { organizationId }
  });

export class UserEdit extends React.Component {
  static propTypes = {
    mutations: PropTypes.object,
    currentUser: PropTypes.object,
    currentOrg: PropTypes.object,
    editedUser: PropTypes.object,
    editUser: PropTypes.object,
    router: PropTypes.object,
    location: PropTypes.object,
    userId: PropTypes.string,
    organizationId: PropTypes.string,
    onRequestClose: PropTypes.func,
    onCancel: PropTypes.func,
    saveLabel: PropTypes.string,
    authType: PropTypes.string,
    nextUrl: PropTypes.string,
    style: PropTypes.string,
    handleClose: PropTypes.func,
    openSuccessDialog: PropTypes.func
  };

  state = {
    changePasswordDialog: false,
    successDialog: false,
    currentOrg: null,
    editedUser: null
  };

  async componentDidMount() {
    if (!this.props.authType && this.props.userId) {
      const response = await fetchUser(
        this.props.organizationId,
        this.props.userId
      );
      this.setState({
        editedUser: response.data
      });
    }
    if (!this.props.authType && this.props.organizationId) {
      const response = await fetchOrg(this.props.organizationId);
      this.setState({
        currentOrg: response.data
      });
    }
  }

  handleSave = async formData => {
    const { router, location } = this.props;
    if (!this.props.authType) {
      if (formData.extra) {
        formData.extra = JSON.stringify(formData.extra);
      }
      await this.props.mutations.editUser(formData);
      if (this.props.onRequestClose) {
        this.props.onRequestClose();
      }
      if (location.query.next) {
        router.push(location.query.next);
      }
    } else if (this.props.authType === "change") {
      // change password
      const res = await this.props.mutations.changePassword(formData);
      if (res.errors) {
        throw new Error(res.errors.graphQLErrors[0].message);
      }
      this.props.openSuccessDialog();
    } else {
      // log in, sign up, or reset
      const allData = {
        nextUrl: this.props.nextUrl,
        authType: this.props.authType,
        ...formData
      };
      const res = await fetch("/login-callback", {
        method: "POST",
        body: JSON.stringify(allData),
        headers: { "Content-Type": "application/json" }
      });
      const { redirected, headers, status, url } = res;
      if (redirected && status === 200) {
        this.props.router.replace(url);
      } else if (status === 401) {
        throw new Error(headers.get("www-authenticate") || "");
      }
    }
  };

  handleClick = () => {
    this.setState({ changePasswordDialog: true });
  };

  handleClose = () => {
    if (this.props.handleClose) {
      this.props.handleClose();
    } else {
      this.setState({ changePasswordDialog: false, successDialog: false });
    }
  };

  openSuccessDialog = () => {
    this.setState({ successDialog: true });
  };

  buildFormSchema = (authType, org) => {
    let passwordFields = {};
    if (authType) {
      passwordFields = {
        password: yup.string().required()
      };
    }

    if (authType === "change") {
      passwordFields = {
        ...passwordFields,
        newPassword: yup.string().required()
      };
    }

    if (authType && authType !== "login") {
      passwordFields = {
        ...passwordFields,
        passwordConfirm: yup
          .string()
          .oneOf(
            [yup.ref(authType === "change" ? "newPassword" : "password")],
            "Passwords must match"
          )
          .required()
      };
    }

    let userFields = {};
    if (!authType || authType === "signup") {
      userFields = {
        firstName: yup.string().required(),
        lastName: yup.string().required(),
        alias: yup.string().nullable(),
        cell: yup.string().required()
      };
    }

    let profileFields = {};
    if (!authType && org && org.profileFields.length) {
      const fields = {};
      org.profileFields.forEach(field => {
        fields[field.name] = yup.string().required();
      });
      profileFields = {
        extra: yup.object({
          ...fields
        })
      };
    }

    return yup.object({
      email: yup
        .string()
        .email()
        .required(),
      ...userFields,
      ...profileFields,
      ...passwordFields
    });
  };

  renderProfileField(field) {
    return (
      <span className={css(styles.fields)} key={field.name}>
        <Form.Field label={field.label} name={`extra.${field.name}`} />
      </span>
    );
  }

  render() {
    const {
      authType,
      currentUser,
      style,
      userId,
      saveLabel,
      router
    } = this.props;
    const onCancel = this.props.onCancel || (router && router.goBack);
    const user = (this.state.editedUser && this.state.editedUser.user) || {};
    if (user && typeof user.extra === "string") {
      user.extra = JSON.parse(user.extra);
    }
    const org = this.state.currentOrg && this.state.currentOrg.organization;
    const formSchema = this.buildFormSchema(authType, org);
    const fieldsNeeded = router && !!router.location.query.fieldsNeeded;

    return (
      <div>
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSave}
          defaultValue={user}
          className={style}
          {...dataTest("userEditForm")}
        >
          <Form.Field label="Email" name="email" {...dataTest("email")} />
          {(!authType || authType === "signup") && (
            <span className={css(styles.fields)}>
              <Form.Field
                label="First name"
                name="firstName"
                {...dataTest("firstName")}
              />
              <Form.Field
                label="Last name"
                name="lastName"
                {...dataTest("lastName")}
              />
              <Form.Field
                label="Texting Alias (optional)"
                name="alias"
                {...dataTest("alias")}
              />
              <Form.Field
                label="Cell Number"
                name="cell"
                {...dataTest("cell")}
              />
            </span>
          )}
          {fieldsNeeded && (
            <h3>Please complete your profile</h3>
          )}
          {!authType && org && org.profileFields.map(this.renderProfileField)}
          {authType && (
            <Form.Field label="Password" name="password" type="password" />
          )}
          {authType === "change" && (
            <Form.Field
              label="New Password"
              name="newPassword"
              type="password"
            />
          )}
          {authType && authType !== "login" && (
            <Form.Field
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
            />
          )}
          {authType !== "change" &&
            userId &&
            userId === currentUser.currentUser.id &&
            !fieldsNeeded && (
              <div className={css(styles.container)}>
                <RaisedButton
                  onTouchTap={this.handleClick}
                  label="Change password"
                  variant="outlined"
                />
              </div>
            )}
          <div className={css(styles.buttons)}>
            <Form.Button
              className={css(styles.submit)}
              type="submit"
              label={saveLabel || "Save"}
            />
            {!authType && onCancel && !fieldsNeeded && (
              <RaisedButton
                className={css(styles.cancel)}
                label="Cancel"
                variant="outlined"
                onClick={onCancel}
              />
            )}
          </div>
        </GSForm>
        <div>
          <Dialog
            {...dataTest("changePasswordDialog")}
            title="Change your password"
            modal={false}
            open={this.state.changePasswordDialog}
            onRequestClose={this.handleClose}
          >
            <UserEdit
              authType="change"
              saveLabel="Save new password"
              handleClose={this.handleClose}
              openSuccessDialog={this.openSuccessDialog}
              userId={this.props.userId}
              mutations={this.props.mutations}
            />
          </Dialog>
          <Dialog
            {...dataTest("successPasswordDialog")}
            title="Password changed successfully!"
            modal={false}
            open={this.state.successDialog}
            onRequestClose={this.handleClose}
            onBackdropClick={this.handleClose}
            onEscapeKeyDown={this.handleClose}
          >
            <RaisedButton onTouchTap={this.handleClose} label="OK" primary />
          </Dialog>
        </div>
      </div>
    );
  }
}

const queries = {
  currentUser: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          firstName
          email
          lastName
          alias
          cell
        }
      }
    `
  }
};

export const editUserMutation = gql`
  mutation editUser(
    $organizationId: String!
    $userId: Int!
    $userData: UserInput
  ) {
    editUser(
      organizationId: $organizationId
      userId: $userId
      userData: $userData
    ) {
      id
      firstName
      lastName
      alias
      cell
      email
      extra
      profileComplete(organizationId: $organizationId)
    }
  }
`;

const mutations = {
  editUser: ownProps => userData => ({
    mutation: editUserMutation,
    variables: {
      userId: ownProps.userId,
      organizationId: ownProps.organizationId,
      userData
    }
  }),
  changePassword: ownProps => formData => ({
    mutation: gql`
      mutation changeUserPassword(
        $userId: Int!
        $formData: UserPasswordChange
      ) {
        changeUserPassword(userId: $userId, formData: $formData) {
          id
        }
      }
    `,
    variables: {
      userId: ownProps.userId,
      formData
    }
  })
};

export default withRouter(
  loadData({
    queries,
    mutations
  })(UserEdit)
);
