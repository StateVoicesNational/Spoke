/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";
import CardContent from "@material-ui/core/CardContent";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";

import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    const { accountSid, authToken, messageServiceSid } = this.props.config;
    const allSet = accountSid && authToken && messageServiceSid;
    this.state = { allSet, ...this.props.config };
    this.props.onAllSetChanged(allSet);
  }

  componentDidUpdate(prevProps) {
    const {
      accountSid: prevAccountSid,
      authToken: prevAuthToken,
      messageServiceSid: prevMessageServiceSid
    } = prevProps.config;
    const prevAllSet = prevAccountSid && prevAuthToken && prevMessageServiceSid;

    const { accountSid, authToken, messageServiceSid } = this.props.config;
    const allSet = accountSid && authToken && messageServiceSid;

    if (!!prevAllSet !== !!allSet) {
      this.props.onAllSetChanged(allSet);
    }
  }

  onFormChange = value => {
    this.setState(value);
  };

  handleOpenTwilioDialog = () => this.setState({ twilioDialogOpen: true });

  handleCloseTwilioDialog = () => this.setState({ twilioDialogOpen: false });

  handleSubmitTwilioAuthForm = async () => {
    const { accountSid, authToken, messageServiceSid } = this.state;
    let twilioError;
    try {
      await this.props.onSubmit({
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken === "<Encrypted>" ? false : authToken,
        twilioMessageServiceSid: messageServiceSid
      });
      await this.props.requestRefetch();
      this.setState({
        twilioError: undefined,
        authToken: this.props.config.authToken
      });
    } catch (caught) {
      console.log("Error submitting Twilio auth", JSON.stringify(caught));
      if (caught.graphQLErrors && caught.graphQLErrors.length > 0) {
        const twilioErrors = caught.graphQLErrors.map(error => error.message);
        twilioError = twilioErrors.join(",");
      } else {
        twilioError = caught.message;
      }
      this.setState({ twilioError });
    }
    this.handleCloseTwilioDialog();
  };

  render() {
    const { organizationId, inlineStyles, styles, config } = this.props;
    const { accountSid, authToken, messageServiceSid } = config;
    const allSet = accountSid && authToken && messageServiceSid;
    let baseUrl = "http://base";
    if (typeof window !== "undefined") {
      baseUrl = window.location.origin;
    }
    const formSchema = yup.object({
      accountSid: yup
        .string()
        .nullable()
        .max(64),
      authToken: yup
        .string()
        .nullable()
        .max(64),
      messageServiceSid: yup
        .string()
        .nullable()
        .max(64)
    });

    return (
      <div>
        {allSet && (
          <CardContent style={inlineStyles.shadeBox}>
            <DisplayLink
              url={`${baseUrl}/twilio/${organizationId}`}
              textContent="Twilio credentials are configured for this organization. You should set the inbound Request URL in your Twilio messaging service to this link."
            />
            Settings for this organization:
            <TableContainer>
              <Table style={{ "background-color": "red" }}>
                <TableBody
                  displayRowCheckbox={false}
                  style={inlineStyles.shadeBox}
                >
                  <TableRow>
                    <TableCell>
                      <b>Twilio Account SID</b>
                    </TableCell>
                    <TableCell>{this.props.config.accountSid}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Twilio Auth Token</b>
                    </TableCell>
                    <TableCell>{this.props.config.authToken}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Default Message Service SID</b>
                    </TableCell>
                    <TableCell>{this.props.config.messageServiceSid}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
        {this.state.twilioError && (
          <CardContent style={inlineStyles.errorBox}>
            {this.state.twilioError}
          </CardContent>
        )}
        <CardContent>
          <div className={css(styles.section)}>
            <span className={css(styles.sectionLabel)}>
              You can set Twilio API credentials specifically for this
              Organization by entering them here.
            </span>
            <GSForm
              schema={formSchema}
              onChange={this.onFormChange}
              defaultValue={this.state}
              onSubmit={this.handleOpenTwilioDialog}
            >
              <Form.Field
                as={GSTextField}
                label="Twilio Account SID"
                name="accountSid"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Twilio Auth Token"
                name="authToken"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Default Message Service SID"
                name="messageServiceSid"
                fullWidth
              />

              <Form.Submit
                as={GSSubmitButton}
                label={this.props.saveLabel || "Save Twilio Credentials"}
              />
              <Dialog open={this.state.twilioDialogOpen}>
                <DialogContent>
                  <DialogContentText>
                    Changing the Account SID or Messaging Service SID will break
                    any campaigns that are currently running. Do you want to
                    contunue?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleCloseTwilioDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleSubmitTwilioAuthForm}
                  >
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </GSForm>
          </div>
        </CardContent>
      </div>
    );
  }
}

OrgConfig.propTypes = {
  organizationId: PropTypes.string,
  config: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onAllSetChanged: PropTypes.func,
  requestRefetch: PropTypes.func
};
