import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";

import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

const styles = StyleSheet.create({
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }
});

export class CampaignContactsForm extends React.Component {
  constructor(props) {
    super(props);
    const { lastResult } = this.props;
    const reference =
      lastResult && lastResult.reference && JSON.parse(lastResult.reference);
    const searchText = (reference && reference.savedListName) || undefined;
    this.state = {
      errorResult: undefined,
      savedListId: undefined,
      searchText
    };
  }

  buildSelectData = () => {
    const { clientChoiceData } = this.props;

    const clientChoiceDataObject = JSON.parse(clientChoiceData);
    if (!clientChoiceDataObject || !clientChoiceDataObject.items) {
      return [];
    }
    return clientChoiceDataObject.items;
  };

  renderSavedLists = () => {
    const selectData = this.buildSelectData();
    return (
      <Autocomplete
        options={selectData}
        getOptionLabel={option => option.name}
        onChange={(event, value) => {
          if (value) {
            this.setState({ savedListId: value.savedListId });
            this.props.onChange(
              JSON.stringify({
                savedListId: value.savedListId,
                savedListName: value.name
              })
            );
          } else {
            this.props.onChange(undefined);
            this.setState({ savedListId: undefined });
          }
        }}
        renderInput={params => (
          <TextField
            {...params}
            style={{ width: 200 }}
            label="Select a list to import"
          />
        )}
      />
    );
  };

  renderSaveButton = () => (
    <Button
      color="primary"
      disabled={this.props.saveDisabled}
      onClick={() => this.props.onSubmit()}
    >
      {this.props.saveLabel}
    </Button>
  );

  renderJobResult = () => {
    const { lastResult } = this.props;
    if (!lastResult) {
      return null;
    }
    const reference =
      (lastResult.reference && JSON.parse(lastResult.reference)) || {};
    const result = (lastResult.result && JSON.parse(lastResult.result)) || {};
    return (
      <List
        subheader={<ListSubheader component="div">Last Import</ListSubheader>}
      >
        {reference.savedListName && (
          <ListItem>
            <ListItemIcon>{this.props.icons.info}</ListItemIcon>
            <ListItemText primary={`List name: ${reference.savedListName}`} />
          </ListItem>
        )}
        {result.errors &&
          result.errors.map(error => (
            <ListItem>
              <ListItemIcon>{this.props.icons.error}</ListItemIcon>
              <ListItemText primary={error} />
            </ListItem>
          ))}
        {(result.dupeCount && (
          <ListItem>
            <ListItemIcon>{this.props.icons.warning}</ListItemIcon>
            <ListItemText primary={`${result.dupeCount} duplicates removed`} />
          </ListItem>
        )) ||
          null}
        {(result.missingCellCount && (
          <ListItem>
            <ListItemIcon>{this.props.icons.warning}</ListItemIcon>
            <ListItemText
              primary={`${result.missingCellCount} contacts with no cell phone removed`}
            />
          </ListItem>
        )) ||
          null}
        {(result.zipCount &&
          lastResult.contactsCount &&
          result.zipCount - 1 < lastResult.contactsCount && (
            <ListItem
              primaryText={`${lastResult.contactsCount -
                result.zipCount} contacts with no ZIP code imported`}
              leftIcon={this.props.icons.info}
            >
              <ListItemIcon>{this.props.icons.info}</ListItemIcon>
              <ListItemText
                primary={`${lastResult.contactsCount -
                  result.zipCount} contacts with no ZIP code imported`}
              />
            </ListItem>
          )) ||
          null}
      </List>
    );
  };

  render() {
    return (
      <div className={css(styles.form)}>
        {this.renderSavedLists()}
        {this.renderJobResult()}
        {this.renderSaveButton()}
      </div>
    );
  }
}

CampaignContactsForm.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  clientChoiceData: type.string,
  jobResultMessage: type.string,
  lastResult: type.string
};
