import React from "react";
import { Card, CardText } from "material-ui/Card";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import RaisedButton from "material-ui/RaisedButton";
import { red500 } from "material-ui/styles/colors";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import theme from "../styles/theme";
import Dialog from "material-ui/Dialog";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import PropTypes from "prop-types";

const styles = StyleSheet.create({
  cards: {
    display: "flex",
    flexWrap: "wrap"
  },
  card: {
    marginRight: 10,
    marginBottom: 10
  },
  buttons: {
    display: "flex"
  },
  editButton: {
    marginRight: 6
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    marginBotton: 16
  },
  submit: {
    marginTop: 32,
    display: "flex",
    justifyContent: "flex-end"
  }
});

export class ManageOrganizations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openTagDialog: false,
      orggId: null,
      dialogTitle: "",
      dialogSubmitHandler: null,
      dialogButtonLabel: ""
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }

  handleOpen() {
    this.setState({
      openTagDialog: true,
      dialogTitle: "Create Organization",
      dialogSubmitHandler: this.handleCreate,
      dialogButtonLabel: "Create",
      orgId: null
    });
  }

  handleClose() {
    this.setState({ openTagDialog: false });
  }

  async handleCreate(formData) {
    console.log(this.props);

    // debugger;
    // const newOrganization = await this.props.mutations.createOrganization(
    //   formData.name,
    //   this.props.userData.currentUser.id,
    //   this.props.inviteData.inviteByHash[0].id
    // );

    // await this.props.data.refetch();
    this.handleClose();
    // console.log(newOrganization);
  }

  render() {
    const organizations = this.props.orgData.organizations;
    const {
      openOrgDialog,
      dialogSubmitHandler,
      dialogTitle,
      dialogButtonLabel,
      orgId
    } = this.state;
    const formSchema = yup.object({
      name: yup.string().required()
    });
    const dialogOrg = orgId ? organizations.find(org => org.id === orgId) : {};
    return (
      <div className={css(styles.cards)}>
        {organizations.map(org => (
          <Card className={css(styles.card)} id={org.id} key={org.id}>
            <CardText>
              <p>{org.name}</p>
            </CardText>
            <CardText className={css(styles.buttons)}>
              <RaisedButton
                className={css(styles.editButton)}
                primary
                label="Edit"
                labelPosition="before"
                icon={<CreateIcon />}
                onTouchTap={() => {
                  console.log("edit");
                }}
              />
              <RaisedButton
                label="Delete"
                labelPosition="before"
                icon={<DeleteIcon color={red500} />}
                onTouchTap={() => {
                  console.log("delete");
                }}
              />
            </CardText>
          </Card>
        ))}
        <FloatingActionButton
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        <Dialog
          title={dialogTitle}
          open={openOrgDialog}
          onRequestClose={this.handleClose}
        >
          <GSForm
            schema={formSchema}
            onSubmit={dialogSubmitHandler}
            defaultValue={dialogOrg}
          >
            <div className={css(styles.fields)}>
              <Form.Field label="Name" name="name" />
            </div>
            <div className={css(styles.submit)}>
              <Form.Button type="submit" label={dialogButtonLabel} />
            </div>
          </GSForm>
        </Dialog>
      </div>
    );
  }
}

ManageOrganizations.propTypes = {
  orgData: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
};

const queries = {
  orgData: {
    query: gql`
      query getInstanceOrganizations {
        organizations {
          id
          name
        }
      }
    `
  },
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
  }
  // userData: {
  //   query: gql`
  //     query getCurrentUser {
  //       currentUser {
  //         id
  //       }
  //     }
  //   `,
  //   options: ownProps => ({
  //     fetchPolicy: "network-only"
  //   })
  // }
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

export default loadData({ queries, mutations })(
  withRouter(ManageOrganizations)
);
