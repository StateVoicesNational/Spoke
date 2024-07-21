import React from "react";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ErrorIcon from "@material-ui/icons/Error";

import withMuiTheme from "./../containers/hoc/withMuiTheme";

export function Error(props) {
  return (
    props.text ? (
      <List>
        <ListItem>
          <ListItemIcon>
            <ErrorIcon color="error" />
          </ListItemIcon>
          <ListItemText primary={props.text} />
        </ListItem>
      </List>
  ) : null);
}

export default withMuiTheme(Error);
