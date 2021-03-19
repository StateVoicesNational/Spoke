import React, { Component } from "react";
import type from "prop-types";

import AutoComplete from "material-ui/AutoComplete";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import { getHighestRole } from "../lib/permissions";
import FlatButton from "material-ui/FlatButton";
import { css, StyleSheet } from "aphrodite";
import theme from "../styles/theme";
import { dataSourceItem } from "./utils";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center"
  },
  flexColumn: {
    flex: 0,
    flexBasis: "30%",
    display: "flex"
  },
  spacer: {
    marginRight: "30px"
  },
  warning: {
    color: "#d68916",
    fontSize: "1.2em",
    fontWeight: "bold"
  }
});

class IncomingMessageActions extends Component {
  constructor(props) {
    super(props);

    this.onReassignmentClicked = this.onReassignmentClicked.bind(this);
    this.onReassignAllMatchingClicked = this.onReassignAllMatchingClicked.bind(
      this
    );
    this.onReassignChanged = this.onReassignChanged.bind(this);

    this.handleConfirmDialogCancel = this.handleConfirmDialogCancel.bind(this);
    this.handleConfirmDialogReassign = this.handleConfirmDialogReassign.bind(
      this
    );

    this.state = {
      confirmDialogOpen: false
    };
  }

  onReassignmentClicked() {
    this.props.onReassignRequested(this.state.reassignTo);
  }

  onReassignAllMatchingClicked() {
    this.setState({ confirmDialogOpen: true });
  }

  onReassignChanged(selection, index) {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        this.setState({ reassignTo: undefined });
        return texter.displayName === selection;
      });
      if (texter) {
        texterUserId = texter.id;
      }
    } else {
      texterUserId = selection.value.key;
    }
    if (texterUserId) {
      this.setState({ reassignTo: parseInt(texterUserId, 10) });
    } else {
      this.setState({ reassignTo: undefined });
    }
  }

  handleConfirmDialogCancel() {
    this.setState({ confirmDialogOpen: false });
  }

  handleConfirmDialogReassign() {
    this.setState({ confirmDialogOpen: false });
    this.props.onReassignAllMatchingRequested(this.state.reassignTo);
  }

  render() {
    const texterNodes = !this.props.people
      ? []
      : this.props.people.map(user => {
          const userId = parseInt(user.id, 10);
          const label = user.displayName + " " + getHighestRole(user.roles);
          return dataSourceItem(label, userId);
        });
    texterNodes.sort((left, right) => {
      return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
    });
    texterNodes.splice(0, 0, dataSourceItem("Unassign", -2));

    const hasCampaignsFilter =
      this.props.campaignsFilter &&
      (this.props.campaignsFilter.campaignIds || []).length;

    const confirmDialogActions = [
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleConfirmDialogCancel}
      />,
      <FlatButton
        label="Reassign"
        primary
        onClick={this.handleConfirmDialogReassign}
      />
    ];
    return (
      <Card>
        <CardHeader
          title={" Message Actions "}
          actAsExpander
          showExpandableButton
        />
        <CardText expandable>
          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <AutoComplete
                filter={AutoComplete.caseInsensitiveFilter}
                maxSearchResults={8}
                onFocus={() =>
                  this.setState({
                    reassignTo: undefined,
                    texterSearchText: ""
                  })
                }
                onUpdateInput={texterSearchText =>
                  this.setState({ texterSearchText })
                }
                searchText={this.state.texterSearchText}
                dataSource={texterNodes}
                hintText={"Search for a texter"}
                floatingLabelText={"Reassign to ..."}
                onNewRequest={this.onReassignChanged}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <FlatButton
                label={"Reassign selected"}
                onClick={this.onReassignmentClicked}
                disabled={!this.state.reassignTo}
              />
            </div>
            {this.props.conversationCount ? (
              <div className={css(styles.flexColumn)}>
                <FlatButton
                  label={`Reassign all ${this.props.conversationCount} matching`}
                  onClick={this.onReassignAllMatchingClicked}
                  disabled={!this.state.reassignTo}
                />
              </div>
            ) : (
              ""
            )}
            <Dialog
              actions={confirmDialogActions}
              open={this.state.confirmDialogOpen}
              modal
              onRequestClose={this.handleConfirmDialogCancel}
            >
              <div>
                {!hasCampaignsFilter && (
                  <div>
                    <span className={css(styles.warning)}>
                      WARNING: you have no campaign filter selected!
                    </span>
                    <br />
                  </div>
                )}
                <div>
                  <b>
                    {"Are you absolutely sure you want to reassign all"}
                    <span className={css(styles.warning)}>
                      {` ${Number(
                        this.props.conversationCount || 0
                      ).toLocaleString()} `}
                    </span>
                    {"matching conversations?"}
                  </b>
                </div>
              </div>
            </Dialog>
          </div>
        </CardText>
      </Card>
    );
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number,
  campaignsFilter: type.object,
  texters: type.array
};

export default IncomingMessageActions;
