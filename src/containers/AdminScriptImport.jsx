import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";

import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Button from "@material-ui/core/Button";
import ErrorIcon from "@material-ui/icons/Error";

import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const styles = StyleSheet.create({
  buttonDiv: {
    marginTop: "10px"
  }
});

export default class AdminScriptImport extends Component {
  static propTypes = {
    startImport: PropTypes.func,
    hasPendingJob: PropTypes.bool,
    jobError: PropTypes.bool,
    onSubmit: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      ...(!!props.jobError && {
        error: `Error from last attempt: ${props.jobError}`
      })
    };
  }

  startImport = async () => {
    const res = await this.props.startImport(this.state.url);
    if (res.errors) {
      this.setState({ error: res.errors.message });
    }
    this.props.onSubmit();
  };

  handleUrlChange = (_eventId, newValue) => this.setState({ url: newValue });

  renderErrors = () =>
    this.state.error && (
      <List>
        <ListItem>
          <ListItemIcon>
            <ErrorIcon color="error" />
          </ListItemIcon>
          <ListItemText primary={this.state.error} />
        </ListItem>
      </List>
    );

  render() {
    const url =
      "https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_IMPORT_GOOGLE_DOCS_SCRIPTS_TO_IMPORT.md";
    return (
      <div>
        <CampaignFormSectionHeading
          title="Script Import"
          subtitle={
            <span>
              You can import interactions and canned responses from a properly
              formatted Google Doc. Please refer to{" "}
              <a target="_blank" href={url}>
                {" "}
                this document
              </a>{" "}
              for more details.
            </span>
          }
        />
        <TextField
          variant="outlined"
          label="Google Doc URL"
          fullWidth
          onChange={this.handleUrlChange}
        />
        {this.renderErrors()}
        <div className={css(styles.buttonDiv)}>
          <Button
            variant="contained"
            disabled={this.props.hasPendingJob}
            color="primary"
            onClick={this.startImport}
          >
            Import
          </Button>
        </div>
      </div>
    );
  }
}
