import React, { Component } from "react";
import type from "prop-types";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Collapse from "@material-ui/core/Collapse";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import IconButton from "@material-ui/core/IconButton";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

import { getHighestRole } from "../lib/permissions";
import { css, StyleSheet } from "aphrodite";
import theme from "../styles/theme";
import { dataSourceItem } from "./utils";
import { MessageStatusSelection } from "./IncomingMessageFilter";

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

    this.handleConfirmDialogCancel = this.handleConfirmDialogCancel.bind(this);
    this.handleConfirmDialogReassign = this.handleConfirmDialogReassign.bind(
      this
    );

    this.state = {
      confirmDialogOpen: false,
      messageStatus: ""
    };
  }

  onReassignmentClicked() {
    this.props.onReassignRequested(this.state.reassignTo);
  }

  onReassignAllMatchingClicked() {
    this.setState({ confirmDialogOpen: true });
  }

  onReassignChanged = (event, selection) => {
    if (selection && selection.rawValue) {
      this.setState({ reassignTo: parseInt(selection.rawValue, 10) });
    } else {
      this.setState({ reassignTo: undefined });
    }
  };

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

    const { expanded } = this.state;

    return (
      <Card>
        <CardHeader
          title={" Message Actions "}
          action={
            <IconButton>
              <ExpandMoreIcon />
            </IconButton>
          }
          onClick={() => {
            this.setState({ expanded: !expanded });
          }}
        />
        <Collapse
          in={expanded}
          timeout="auto"
          unmountOnExit
          style={{
            margin: "20px"
          }}
        >
          <CardContent>
            <div className={css(styles.container)}>
              <div className={css(styles.flexColumn)}>
                <Autocomplete
                  style={{ width: "100%" }}
                  options={texterNodes}
                  onChange={this.onReassignChanged}
                  inputValue={this.state.texterSearchText}
                  onInputChange={(event, newInputValue) => {
                    this.setState({ newInputValue });
                  }}
                  getOptionLabel={option => option.text}
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder="Search for a texter"
                      label="Reassign to ..."
                    />
                  )}
                />
              </div>
              <div className={css(styles.spacer)} />
              <div className={css(styles.flexColumn)}>
                <Button
                  onClick={this.onReassignmentClicked}
                  disabled={!this.state.reassignTo}
                  variant="outlined"
                >
                  Reassign selected
                </Button>
              </div>
              {this.props.conversationCount && (
                <div className={css(styles.flexColumn)}>
                  <Button
                    variant="outlined"
                    onClick={this.onReassignAllMatchingClicked}
                    disabled={!this.state.reassignTo}
                  >
                    Reassign all {this.props.conversationCount} matching
                  </Button>
                </div>
              )}
              <Dialog
                open={this.state.confirmDialogOpen}
                onClose={this.handleConfirmDialogCancel}
              >
                <DialogContent>
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
                </DialogContent>
                <DialogActions>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={this.handleConfirmDialogCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={this.handleConfirmDialogReassign}
                  >
                    Reassign
                  </Button>
                </DialogActions>
              </Dialog>
            </div>
            <div className={css(styles.container)}>
              <MessageStatusSelection
                label="Change conversation status"
                width="30%"
                value={this.state.messageStatus}
                statusFilter={status =>
                  status != "needsResponseExpired" && status != "all"
                }
                onChange={async event => {
                  const { value } = event.target;
                  console.log("change convo", value);
                  this.setState({ messageStatus: value });
                  await this.props.onChangeMessageStatus(value);
                  this.setState({ messageStatus: "" });
                }}
              />
            </div>
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

IncomingMessageActions.propTypes = {
  people: type.array,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  onChangeMessageStatus: type.func.isRequired,
  conversationCount: type.number,
  campaignsFilter: type.object,
  texters: type.array
};

export default IncomingMessageActions;
