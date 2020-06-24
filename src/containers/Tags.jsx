import React from "react";
import { Card, CardText } from "material-ui/Card";
import Chip from "../components/Chip";
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
            <CardText>
              <Chip style={{ margin: 0 }} text={t.name} />
            </CardText>
            <CardText>{t.description}</CardText>
            <CardText className={css(styles.buttons)}>
              <RaisedButton
                className={css(styles.editButton)}
                primary
                label="Edit"
                labelPosition="before"
                icon={<CreateIcon />}
                onTouchTap={this.handleOpenEdit(t.id)}
              />
              <RaisedButton
                label="Delete"
                labelPosition="before"
                icon={<DeleteIcon color={red500} />}
                onTouchTap={this.handleDelete(t.id)}
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
          open={openTagDialog}
          onRequestClose={this.handleClose}
        >
          <GSForm
            schema={formSchema}
            onSubmit={dialogSubmitHandler}
            defaultValue={dialogTag}
          >
            <div className={css(styles.fields)}>
              <Form.Field label="Name" name="name" />
              <Form.Field label="Description" name="description" />
              <Form.Field
                label="Group ('texter-tags' for texters)"
                name="group"
              />
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
