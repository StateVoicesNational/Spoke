import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";

import theme from "../styles/theme";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import TextField from "material-ui/TextField";
import { ListItem, List } from "material-ui/List";
import RaisedButton from "material-ui/RaisedButton";
import ErrorIcon from "material-ui/svg-icons/alert/error";

const errorIcon = <ErrorIcon color={theme.colors.red} />;

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
    onSubmit: PropTypes.bool
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
        <ListItem primaryText={this.state.error} leftIcon={errorIcon} />
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
                this document
              </a>{" "}
              for more details.
            </span>
          }
        />
        <TextField
          hintText="URL of the Google Doc"
          floatingLabelText="Google Doc URL"
          style={{ width: "100%" }}
          onChange={this.handleUrlChange}
        />
        {this.renderErrors()}
        <div className={css(styles.buttonDiv)}>
          <RaisedButton
            label="Import"
            disabled={this.props.hasPendingJob}
            primary
            onTouchTap={this.startImport}
          />
        </div>
      </div>
    );
  }
}
