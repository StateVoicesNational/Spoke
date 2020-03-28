import React from "react";
import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import Chip from "../components/Chip";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import RaisedButton from "material-ui/RaisedButton";
import { red500 } from "material-ui/styles/colors";
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
  render() {
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
      </div>
    );
  }
}

export default Tags;
