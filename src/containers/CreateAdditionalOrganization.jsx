import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import Form from "react-formal";
import * as yup from "yup";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import TopNav from "../components/TopNav";
import Paper from "@material-ui/core/Paper";
import { withRouter } from "react-router";
import GSForm from "../components/forms/GSForm";
import GSTextField from "../components/forms/GSTextField";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  container: {
    textAlign: "center",
    color: theme.colors.white
  },
  formContainer: {
    ...theme.layouts.greenBox
  },
  header: {
    ...theme.text.header,
    marginRight: "auto",
    marginLeft: "auto",
    maxWidth: "80%"
  },
  form: {
    marginTop: 40,
    maxWidth: "80%",
    marginRight: "auto",
    marginLeft: "auto"
  }
});

class CreateAdditionalOrganization extends React.Component {
  formSchema = yup.object({
    name: yup.string().required()
  });
  renderInvalid() {
    return (
      <div>
        That invite is no longer valid. This probably means it already got used!
      </div>
    );
  }

  renderForm() {
    return (
      <div>
        <div className={css(styles.header)}>
          Create an additional organization below!
        </div>
        <div className={css(styles.form)}>
          <Paper style={{ padding: 20 }}>
            <GSForm
              schema={this.formSchema}
              onSubmit={async formValues => {
                await this.props.mutations.createOrganization(
                  formValues.name,
                  this.props.userData.currentUser.id,
                  this.props.inviteData.inviteByHash[0].id
                );
                this.props.router.push(`/organizations`);
              }}
            >
              <Form.Field
                as={GSTextField}
                {...dataTest("organization")}
                name="name"
                label="Your organization"
                hintText="Bartlet Campaign"
                fullWidth
              />
              <Form.Submit
                as={GSSubmitButton}
                label="Create"
                name="submit"
                value="Create"
                fullWidth
                secondary
                style={{ marginTop: 40 }}
              />
            </GSForm>
          </Paper>
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.userData.currentUser.is_superadmin) {
      return (
        <div>
          You must be a super admin to create an additional organization.
        </div>
      );
    }
    return (
      <div>
        <TopNav title={"Add An Organization"} />
        <div className={css(styles.container)}>
          <div className={css(styles.formContainer)}>
            {this.props.inviteData.inviteByHash &&
            this.props.inviteData.inviteByHash[0].isValid
              ? this.renderForm()
              : this.renderInvalid()}
          </div>
        </div>
      </div>
    );
  }
}

CreateAdditionalOrganization.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  userData: PropTypes.object,
  inviteData: PropTypes.object
};

const queries = {
  inviteData: {
    query: gql`
      query getInvite($inviteId: String!) {
        inviteByHash(hash: $inviteId) {
          id
          isValid
        }
      }
    `,
    options: ownProps => ({
      variables: {
        inviteId: ownProps.params.inviteId
      },
      fetchPolicy: "network-only"
    })
  },
  userData: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          is_superadmin
        }
      }
    `,
    options: () => ({
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  createOrganization: () => (name, userId, inviteId) => ({
    mutation: gql`
      mutation createOrganization(
        $name: String!
        $userId: String!
        $inviteId: String!
      ) {
        createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
          id
        }
      }
    `,
    variables: { name, userId, inviteId }
  })
};

export default loadData({ queries, mutations })(
  withRouter(CreateAdditionalOrganization)
);
