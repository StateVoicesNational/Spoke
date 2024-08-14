// Spoke: A mass-contact text/SMS peer-to-peer messaging tool
// Copyright (c) 2016-2021 MoveOn Civic Action
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License version 3 as
// published by the Free Software Foundation,
// with the Additional Term under Section 7(b) to include preserving
// the following author attribution statement in the Spoke application:
//
//    Spoke is developed and maintained by people committed to fighting
//    oppressive systems and structures, including economic injustice,
//    racism, patriarchy, and militarism
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program (see ./LICENSE). If not, see <https://www.gnu.org/licenses/>.

import PropTypes from "prop-types";
import React from "react";
import { gql } from "@apollo/client";
import { withRouter } from "react-router";
import Form from "react-formal";
import * as yup from "yup";

import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import { StyleSheet, css } from "aphrodite";
import apolloClient from "../network/apollo-client-singleton";
import { dataTest } from "../lib/attributes";
import withMuiTheme from "./hoc/withMuiTheme";
import GSPasswordField from "../components/forms/GSPasswordField";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import GSTextField from "../components/forms/GSTextField";
import GSCheckbox from "../components/forms/GSCheckbox";
import GSForm from "../components/forms/GSForm";
import loadData from "./hoc/load-data";

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

const fetchUser = async (organizationId, userId) => {
  try {
    const response = await apolloClient.query({
      query: gql`
        query getEditedUser($organizationId: String!, $userId: Int!) {
          user(organizationId: $organizationId, userId: $userId) {
            id
            firstName
            email
            lastName
            alias
            cell
            dark
            extra
          }
        }
      `,
      variables: { organizationId, userId }
    });
    return response;
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};

const fetchOrg = async organizationId =>
  apolloClient.query({
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          theme
          profileFields {
            name
            label
          }
        }
      }
    `,
    variables: { organizationId }
  });

export class UserEditBase extends React.Component {
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
        parseInt(this.props.userId)
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
      } else {
        /* force reload in case darkMode is flipped */
        router.push({ pathname: "" });
        router.replace({ pathname: location.pathname });
        /* this isn't working */
        // const newTheme =  {palette:{...this.props.muiTheme.palette, type: formData.dark ? 'dark' : 'light'}}
        // this.props.setTheme(newTheme)
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
        cell: yup.string().required(),
        dark: yup.boolean().nullable()
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
        <Form.Field
          as={GSTextField}
          label={field.label}
          name={`extra.${field.name}`}
        />
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
      <div style={{ padding: 20 }}>
        {userId ? (<div style={{}}>User Id: {userId}</div>) : null}
        <GSForm
          style={{}}
          schema={formSchema}
          onSubmit={this.handleSave}
          defaultValue={user}
          className={style}
          {...dataTest("userEditForm")}
        >
          <Form.Field
            fullWidth
            as={GSTextField}
            label="Email"
            name="email"
            disabled={window.PASSPORT_STRATEGY === "auth0"}
            {...dataTest("email")}
          />
          {(!authType || authType === "signup") && (
            <span className={css(styles.fields)}>
              <Form.Field
                as={GSTextField}
                label="First name"
                name="firstName"
                {...dataTest("firstName")}
              />
              <Form.Field
                as={GSTextField}
                label="Last name"
                name="lastName"
                {...dataTest("lastName")}
              />
              <Form.Field
                as={GSTextField}
                label="Texting Alias (optional)"
                name="alias"
                {...dataTest("alias")}
              />
              <Form.Field
                as={GSTextField}
                label="Cell Number"
                name="cell"
                {...dataTest("cell")}
              />
              <Form.Field
                as={GSCheckbox}
                label="Use Dark Mode"
                name="dark"
                {...dataTest("dark")}
              />
            </span>
          )}
          {fieldsNeeded && <h3>Please complete your profile</h3>}
          {!authType && org && org.profileFields.map(this.renderProfileField)}
          {authType && (
            <Form.Field
              fullWidth
              as={GSPasswordField}
              label="Password"
              name="password"
              type="password"
            />
          )}
          {authType === "change" && (
            <Form.Field
              fullWidth
              as={GSPasswordField}
              label="New Password"
              name="newPassword"
              type="password"
            />
          )}
          {authType && authType !== "login" && (
            <Form.Field
              fullWidth
              as={GSPasswordField}
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
                {window.PASSPORT_STRATEGY !== "auth0" && (
                  <Button onClick={this.handleClick} variant="outlined">
                    Change password
                  </Button>
                )}
              </div>
            )}
          <div className={css(styles.buttons)}>
            <Form.Submit
              as={GSSubmitButton}
              className={css(styles.submit)}
              label={saveLabel || "Save"}
            />
            {!authType && onCancel && !fieldsNeeded && (
              <Button
                className={css(styles.cancel)}
                variant="outlined"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        </GSForm>
        <div>
          <Dialog
            {...dataTest("changePasswordDialog")}
            title="Change your password"
            open={this.state.changePasswordDialog}
            onClose={this.handleClose}
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
            open={this.state.successDialog}
            onClose={this.handleClose}
            onBackdropClick={this.handleClose}
            onEscapeKeyDown={this.handleClose}
          >
            <Button onClick={this.handleClose} color="primary">
              OK
            </Button>
          </Dialog>
        </div>
        <Card style={{ marginTop: "50px", maxWidth: "256px" }}>
          <CardContent style={{ fontSize: "90%" }}>
            Spoke is developed and maintained by people committed to fighting
            oppressive systems and structures, including economic injustice,
            racism, patriarchy, and militarism.
          </CardContent>
        </Card>
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
          dark
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
      dark
      extra
      profileComplete(organizationId: $organizationId)
    }
  }
`;

const mutations = {
  editUser: ownProps => userData => ({
    mutation: editUserMutation,
    variables: {
      userId: parseInt(ownProps.userId),
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

const UserEdit = withMuiTheme(
  withRouter(loadData({ queries, mutations })(UserEditBase))
);

export default UserEdit;
