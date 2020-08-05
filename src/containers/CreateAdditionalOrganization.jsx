import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import Form from "react-formal";
import yup from "yup";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Paper from "material-ui/Paper";
import { withRouter } from "react-router";
import GSForm from "../components/forms/GSForm";
import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center",
    color: theme.colors.white
  },
  formContainer: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
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

class CreateOrganization extends React.Component {
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
          Create your organization to get started.
        </div>
        <div className={css(styles.form)}>
          <Paper style={{ padding: 20 }}>
            <GSForm
              schema={this.formSchema}
              onSubmit={async formValues => {
                const newOrganization = await this.props.mutations.createOrganization(
                  formValues.name,
                  this.props.userData.currentUser.id,
                  this.props.inviteData.inviteByHash[0].id
                );
                this.props.router.push(
                  `/admin/${newOrganization.data.createOrganization.id}`
                );
              }}
            >
              <Form.Field
                {...dataTest("organization")}
                name="name"
                label="Your organization"
                hintText="Bartlet Campaign"
                fullWidth
              />
              <Form.Button
                type="submit"
                label="Get Started"
                name="submit"
                value="Get Started"
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
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>Spoke</div>
        <div className={css(styles.formContainer)}>
          {this.props.inviteData.inviteByHash &&
          this.props.inviteData.inviteByHash[0].isValid
            ? this.renderForm()
            : this.renderInvalid()}
        </div>
      </div>
    );
  }
}

CreateOrganization.propTypes = {
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
        }
      }
    `,
    options: ownProps => ({
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  createOrganization: ownProps => (name, userId, inviteId) => ({
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

export default loadData({ queries, mutations })(withRouter(CreateOrganization));
