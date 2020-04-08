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
import wrapMutations from "./hoc/wrap-mutations";
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
    textAlign: "right"
  }
});

class Tags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openTagDialog: false,
      dialogMode: "create",
      tagId: null
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpenEdit = this.handleOpenEdit.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleOpen() {
    this.setState({ openTagDialog: true, dialogMode: "create", tagId: null });
  }

  handleOpenEdit(tagId) {
    return () =>
      this.setState({ openTagDialog: true, dialogMode: "edit", tagId });
  }

  handleClose() {
    this.setState({ openTagDialog: false });
  }

  async handleCreate(formData) {
    await this.props.mutations.createTag(
      formData,
      this.props.params.organizationId
    );
    this.handleClose();
  }

  async handleEdit(formData) {
    await this.props.mutations.editTag(
      formData,
      this.props.params.organizationId,
      this.state.tagId
    );
    this.handleClose();
  }

  handleDelete(id) {
    return () =>
      this.props.mutations.deleteTag(this.props.params.organizationId, id);
  }

  render() {
    const { tags } = this.props.data.tags;
    const { openTagDialog, dialogMode, tagId } = this.state;
    const formSchema = yup.object({
      name: yup.string().required(),
      description: yup.string().nullable()
    });
    const dialogTag = tagId ? tags.find(t => t.id === tagId) : {};
    return (
      <div className={css(styles.cards)}>
        {tags.map(t => (
          <Card className={css(styles.card)} key={t.id}>
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
          title={dialogMode === "create" ? "Create Tag" : "Edit Tag"}
          open={openTagDialog}
          onRequestClose={this.handleClose}
        >
          <GSForm
            schema={formSchema}
            onSubmit={
              dialogMode === "create" ? this.handleCreate : this.handleEdit
            }
            defaultValue={dialogTag}
          >
            <div className={css(styles.fields)}>
              <Form.Field label="Name" name="name" />
              <Form.Field label="Description" name="description" />
            </div>
            <Form.Button
              className={css(styles.submit)}
              type="submit"
              label={dialogMode === "create" ? "Create" : "Save"}
            />
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

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getTags($organizationId: String!) {
        tags(organizationId: $organizationId) {
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
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
});

const mapMutationsToProps = () => ({
  createTag: (tagData, organizationId) => ({
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
    },
    refetchQueries: [`getTags`]
  }),
  editTag: (tagData, organizationId, id) => ({
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
    },
    refetchQueries: [`getTags`]
  }),
  deleteTag: (organizationId, id) => ({
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
    },
    refetchQueries: [`getTags`]
  })
});

export default loadData(wrapMutations(Tags), {
  mapQueriesToProps,
  mapMutationsToProps
});
