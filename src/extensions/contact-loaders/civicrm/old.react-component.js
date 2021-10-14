
// Moved into a separate file so it can still be referenced, but no longer cause
// linting errors in the current file

import DeleteIcon from "@material-ui/icons/Delete";
import Avatar from "@material-ui/core/Avatar";
import FolderIcon from "@material-ui/icons/Folder";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import LoadingIndicator from "../../../components/LoadingIndicator";
import * as _ from "lodash";
import Paper from "@material-ui/core/Paper";
import type from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import fetch from "node-fetch";
import {
  CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT,
  CIVICRM_MINQUERY_SIZE
} from "./util";
import CircularProgress from "@material-ui/core/CircularProgress";
import { log } from '../../../lib/log';

class MultiAutoCompleteSelect extends React.Component {
  state = {
    error: null,
    list: null,
    value: [],
    searchText: "",
    result: []
  };

  refreshList(query) {
    if (query.length < CIVICRM_MINQUERY_SIZE) {
      this.setState({ result: [] });
      return;
    }

    this.setState({ loading: true });
    fetch(`${CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT}?query=${query}`, {
      credentials: "same-origin"
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          this.setError(res.error);
        } else {
          this.setState({ result: res.groups, loading: false, error: null });
        }
      })
      .catch(error => {
        log.error(error);
        this.setError(error);
      });
  }

  setError(error) {
    this.setState({ loading: false, error });
  }

  componentWillReceiveProps(props) {
    this.setState({ value: props.value });
  }

  // The above is unsafe, but seems to be used. We need to do something about that.
  // static getDerivedStateFromProps(nextProps, prevState) {
  //   if (nextProps.value !== prevState.value) {
  //     return { value: nextProps.value };
  //   }
  //   else return null; // Triggers no change in the state
  // }

  remove(id) {
    this.setState(old => ({
      value: _.remove(old.value, item => item.id === id)
    }));
  }

  render() {
    const self = this;

    return (
      <div style={{ display: "flex" }}>
        <Paper elevation={2} style={{ flexBasis: "50%" }}>
          <div style={{ padding: "5px" }}>
            <div style={{ display: "flex" }}>
              <List style={{ flexBasis: "50%" }}>
                <ListSubheader inset>Selected groups</ListSubheader>
                {(this.props.value || []).map(value => (
                  <ListItem key={value.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <FolderIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={value.title} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={this.remove.bind(this, value.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </div>

            <div style={{ display: "flex" }}>
              <Autocomplete
                style={{ flexBasis: "33.33%" }}
                options={this.state.result}
                label="CiviCRM list"
                name="groupId"
                as="select"
                filter={Autocomplete.noFilter}
                onChange={function(event, el) {
                  if (el) {
                    self.setState(old => {
                      const newValue = old.value.concat([el]);
                      self.props.onChange(newValue);
                      return { value: newValue, searchText: "" };
                    });
                  } else {
                    self.setState({ value: [], searchText: "" });
                  }
                }}
                onInputChange={(event, text) => {
                  this.refreshList(text);
                  this.setState({ searchText: text });
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label="CiviCRM Groups"
                    variant="outlined"
                  />
                )}
                getOptionLabel={option => option.title || ""}
              />
              {this.state.loading && <LoadingIndicator />}
            </div>
          </div>
        </Paper>
      </div>
    );
  }
}


