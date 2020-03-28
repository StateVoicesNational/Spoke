import React from "react";
import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import Chip from "../components/Chip";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import { red500 } from "material-ui/styles/colors";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import theme from "../styles/theme";
import Dialog from "material-ui/Dialog";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

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
  dialogButtons: {
    marginTop: 32,
    textAlign: "right"
  }
});

const tags = [
  {
    name: "fun",
    description: "this is fun",
    is_deleted: false
  },
  {
    name: "stupid",
    description: "this is stupid",
    is_deleted: false
  },
  {
    name: "fun",
    description: "this is fun",
    is_deleted: false
  },
  {
    name: "stupid",
    description: "this is stupid",
    is_deleted: false
  },
  {
    name: "fun",
    description: "this is fun",
    is_deleted: false
  },
  {
    name: "stupid",
    description: "this is stupid",
    is_deleted: false
  },
  {
    name: "fun",
    description: "this is fun",
    is_deleted: false
  },
  {
    name: "stupid",
    description: "this is stupid",
    is_deleted: false
  }
];

class Tags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openTagDialog: false
    };
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleOpen() {
    this.setState({ openTagDialog: true });
  }

  handleClose() {
    this.setState({ openTagDialog: false });
  }

  render() {
    const formSchema = yup.object({
      title: yup.string().required(),
      description: yup.string().nullable()
    });
    return (
      <div className={css(styles.cards)}>
        {tags.map((tag, id) => (
          <Card className={css(styles.card)} key={id}>
            <CardText>
              <Chip style={{ margin: 0 }} text={tag.name} />
            </CardText>
            <CardText>{tag.description}</CardText>
            <CardText className={css(styles.buttons)}>
              <RaisedButton
                className={css(styles.editButton)}
                primary
                label="Edit"
                labelPosition="before"
                icon={<CreateIcon />}
              />
              <RaisedButton
                label="Delete"
                labelPosition="before"
                icon={<DeleteIcon color={red500} />}
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
          title="Create Tag"
          modal={false}
          open={this.state.openTagDialog}
          onRequestClose={this.handleClose}
        >
          <GSForm schema={formSchema} onSubmit={this.handleSave}>
            <div className={css(styles.fields)}>
              <Form.Field label="Title" name="title" />
              <Form.Field label="Description" name="description" />
            </div>
            <div className={css(styles.dialogButtons)}>
              <FlatButton onTouchTap={this.handleClose} label="Cancel" />
              <FlatButton onTouchTap={this.handleAdd} label="Create" primary />
            </div>
          </GSForm>
        </Dialog>
      </div>
    );
  }
}

export default Tags;
