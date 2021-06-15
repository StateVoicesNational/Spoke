import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import PropTypes from "prop-types";

import DialogTitle from "@material-ui/core/DialogTitle";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import CreateIcon from "@material-ui/icons/Create";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import Chip from "../components/Chip";
import theme from "../styles/theme";
import GSForm from "../components/forms/GSForm";
import GSTextField from "../components/forms/GSTextField";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import loadData from "./hoc/load-data";

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

export class Tags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openTagDialog: false,
      tagId: null,
      dialogTitle: "",
      dialogSubmitHandler: null,
      dialogButtonLabel: ""
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpenEdit = this.handleOpenEdit.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleOpen() {
    this.setState({
      openTagDialog: true,
      dialogTitle: "Create Tag",
      dialogSubmitHandler: this.handleCreate,
      dialogButtonLabel: "Create",
      tagId: null
    });
  }

  handleOpenEdit(tagId) {
    return () =>
      this.setState({
        openTagDialog: true,
        dialogTitle: `Edit Tag (id: ${tagId})`,
        dialogSubmitHandler: this.handleEdit,
        dialogButtonLabel: "Save",
        tagId
      });
  }

  handleClose() {
    this.setState({ openTagDialog: false });
  }

  async handleCreate(formData) {
    await this.props.mutations.createTag(
      formData,
      this.props.params.organizationId
    );
    await this.props.data.refetch();
    this.handleClose();
  }

  async handleEdit(formData) {
    await this.props.mutations.editTag(
      formData,
      this.props.params.organizationId,
      this.state.tagId
    );
    await this.props.data.refetch();
    this.handleClose();
  }

  handleDelete(id) {
    return async () => {
      await this.props.mutations.deleteTag(
        this.props.params.organizationId,
        id
      );
      this.props.data.refetch();
    };
  }

  render() {
    const tags = this.props.data.organization.tags.sort((a, b) => a.id - b.id);
    const {
      openTagDialog,
      dialogSubmitHandler,
      dialogTitle,
      dialogButtonLabel,
      tagId
    } = this.state;
    const formSchema = yup.object({
      name: yup.string().required(),
      description: yup.string().required(),
      group: yup.string().nullable()
    });
    const dialogTag = tagId ? tags.find(t => t.id === tagId) : {};
    return (
      <div className={css(styles.cards)}>
        {tags.map(t => (
          <Card className={css(styles.card)} id={t.id} key={t.id}>
            <CardContent>
              <Chip style={{ margin: 0 }} text={t.name} />
            </CardContent>
            <CardContent>{t.description}</CardContent>
            <CardContent className={css(styles.buttons)}>
              <Button
                variant="contained"
                className={css(styles.editButton)}
                color="primary"
                endIcon={<CreateIcon />}
                onClick={this.handleOpenEdit(t.id)}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                endIcon={<DeleteIcon color="error" />}
                onClick={this.handleDelete(t.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        <Fab
          color="primary"
          style={theme.components.floatingButton}
          onClick={this.handleOpen}
        >
          <AddIcon />
        </Fab>
        <Dialog
          open={openTagDialog}
          onClose={this.handleClose}
          fullWidth={true}
          maxWidth="md"
        >
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <GSForm
              schema={formSchema}
              onSubmit={dialogSubmitHandler}
              defaultValue={dialogTag}
            >
              <div className={css(styles.fields)}>
                <Form.Field as={GSTextField} label="Name" name="name" />
                <Form.Field
                  as={GSTextField}
                  label="Description"
                  name="description"
                />
                <Form.Field
                  as={GSTextField}
                  label="Group ('texter-tags' for texters)"
                  name="group"
                />
              </div>
              <div className={css(styles.submit)}>
                <Form.Submit as={GSSubmitButton} label={dialogButtonLabel} />
              </div>
            </GSForm>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

Tags.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getTags($organizationId: String!) {
        organization(id: $organizationId) {
          id
          tags {
            id
            name
            group
            description
            isDeleted
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  createTag: ownProps => (tagData, organizationId) => ({
    mutation: gql`
      mutation createTag($tagData: TagInput!, $organizationId: String!) {
        createTag(tagData: $tagData, organizationId: $organizationId) {
          id
        }
      }
    `,
    variables: {
      tagData,
      organizationId
    }
  }),
  editTag: ownProps => (tagData, organizationId, id) => ({
    mutation: gql`
      mutation editTag(
        $tagData: TagInput!
        $organizationId: String!
        $id: String!
      ) {
        editTag(tagData: $tagData, organizationId: $organizationId, id: $id) {
          id
        }
      }
    `,
    variables: {
      tagData,
      organizationId,
      id
    }
  }),
  deleteTag: ownProps => (organizationId, id) => ({
    mutation: gql`
      mutation deleteTag($organizationId: String!, $id: String!) {
        deleteTag(organizationId: $organizationId, id: $id) {
          id
        }
      }
    `,
    variables: {
      organizationId,
      id
    }
  })
};

export default loadData({ queries, mutations })(withRouter(Tags));
