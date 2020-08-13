import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import { ListItem, List } from "material-ui/List";
import { StyleSheet, css } from "aphrodite";
import AutoComplete from "material-ui/AutoComplete";
import Subheader from "material-ui/Subheader";

import { dataSourceItem } from "../../../components/utils";

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
    return clientChoiceDataObject.items.map(item =>
      dataSourceItem(item.name, item.savedListId)
    );
  };

  renderSavedLists = () => {
    const selectData = this.buildSelectData();
    return (
      <AutoComplete
        ref="autocomplete"
        // style={inlineStyles.autocomplete}
        autoFocus
        onFocus={() => {
          this.setState({ searchText: "", savedListId: undefined });
          this.props.onChange(undefined);
        }}
        onUpdateInput={searchText => {
          this.setState({ searchText });
          if (searchText.trim().length === 0) {
            this.props.onChange(undefined);
          }
        }}
        searchText={this.state.searchText}
        filter={AutoComplete.caseInsensitiveFilter}
        hintText="Select a list to import"
        dataSource={selectData}
        onNewRequest={value => {
          // If you're searching but get no match, value is a string
          // representing your search term, but we only want to handle matches
          if (typeof value === "object") {
            const savedListId = value.rawValue;
            this.setState({ savedListId });
            this.props.onChange(
              JSON.stringify({
                savedListId,
                savedListName: this.state.searchText
              })
            );
          } else {
            // if it matches one item, that's their selection
            const regex = new RegExp(`.*${value}.*`, "i");
            const matches = selectData.filter(item => regex.test(item.text));

            if (matches.length === 1) {
              const savedListId = matches[0].rawValue;
              const searchText = matches[0].text;
              this.setState({ searchText, savedListId });
              this.props.onChange(
                JSON.stringify({ savedListId, savedListName: searchText })
              );
            }
          }
        }}
      />
    );
  };

  renderSaveButton = () => (
    <RaisedButton
      primary
      disabled={this.props.saveDisabled}
      label={this.props.saveLabel}
      onTouchTap={() => this.props.onSubmit()}
    />
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
      <List>
        <Subheader>Last Import</Subheader>
        {reference.savedListName && (
          <ListItem
            primaryText={`List name: ${reference.savedListName}`}
            leftIcon={this.props.icons.info}
          />
        )}
        {result.errors &&
          result.errors.map(error => (
            <ListItem
              primaryText={`${error}`}
              leftIcon={this.props.icons.error}
            />
          ))}
        {(result.dupeCount && (
          <ListItem
            primaryText={`${result.dupeCount} duplicates removed`}
            leftIcon={this.props.icons.warning}
          />
        )) ||
          null}
        {(result.missingCellCount && (
          <ListItem
            primaryText={`${result.missingCellCount} contacts with no cell phone removed`}
            leftIcon={this.props.icons.warning}
          />
        )) ||
          null}
        {(result.zipCount &&
          lastResult.contactsCount &&
          result.zipCount - 1 < lastResult.contactsCount && (
            <ListItem
              primaryText={`${lastResult.contactsCount -
                result.zipCount} contacts with no ZIP code imported`}
              leftIcon={this.props.icons.info}
            />
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
