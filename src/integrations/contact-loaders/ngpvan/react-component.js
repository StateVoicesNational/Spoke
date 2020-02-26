import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import { ListItem, List } from "material-ui/List";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import { StyleSheet, css } from "aphrodite";
import AutoComplete from "material-ui/AutoComplete";
import theme from "../../../styles/theme";

import { dataSourceItem } from "../../../components/utils";

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  }
};

const styles = StyleSheet.create({
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }
});

export class CampaignContactsForm extends React.Component {
  state = {
    errorResult: null,
    savedListId: undefined
  };

  buildSelectData = () => {
    const { clientChoiceData } = this.props;
    const clientChoiceDataObject = JSON.parse(clientChoiceData);
    console.log('client choice data obj ', clientChoiceDataObject);
    return clientChoiceDataObject.map(item =>
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
            this.props.onChange(savedListId);
          } else {
            // if it matches one item, that's their selection
            const regex = new RegExp(`.*${value}.*`, "i");
            const matches = selectData.filter(item => regex.test(item.text));

            if (matches.length === 1) {
              const savedListId = matches[0].rawValue;
              const searchText = matches[0].text;
              this.setState({ searchText, savedListId });
              this.props.onChange(savedListId);
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

  renderJobResult = () =>
    this.props.jobResultMessage ? (
      <List>
        <ListItem
          primaryText={this.props.jobResultMessage}
          leftIcon={this.props.icons.warning}
        />
      </List>
    ) : null;

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
  jobResultMessage: type.string
};
