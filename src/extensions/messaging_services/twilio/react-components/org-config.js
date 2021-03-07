/* eslint no-console: 0 */
import { css } from "aphrodite";
import { CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { Table, TableBody, TableRow, TableRowColumn } from "material-ui/Table";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import yup from "yup";
import DisplayLink from "../../../../components/DisplayLink";
import GSForm from "../../../../components/forms/GSForm";
import GSSubmitButton from "../../../../components/forms/GSSubmitButton";

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

  handleSubmitTwilioAuthForm = async p => {
    const { accountSid, authToken, messageServiceSid } = p;
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

    const dialogActions = [
      <FlatButton
        label="Cancel"
        style={inlineStyles.dialogButton}
        onClick={this.handleCloseTwilioDialog}
      />,
      <Form.Button
        type="submit"
        label="Save"
        style={inlineStyles.dialogButton}
        component={GSSubmitButton}
      />
    ];

    return (
      <div>
        {allSet && (
          <CardText style={inlineStyles.shadeBox}>
            <DisplayLink
              url={`${baseUrl}/twilio/${organizationId}`}
              textContent="Twilio credentials are configured for this organization. You should set the inbound Request URL in your Twilio messaging service to this link."
            />
            Settings for this organization:
            <Table selectable={false} bodyStyle={{ "background-color": "red" }}>
              <TableBody
                displayRowCheckbox={false}
                style={inlineStyles.shadeBox}
              >
                <TableRow>
                  <TableRowColumn>
                    <b>Twilio Account SID</b>
                  </TableRowColumn>
                  <TableRowColumn>
                    {this.props.config.accountSid}
                  </TableRowColumn>
                </TableRow>
                <TableRow>
                  <TableRowColumn>
                    <b>Twilio Auth Token</b>
                  </TableRowColumn>
                  <TableRowColumn>{this.props.config.authToken}</TableRowColumn>
                </TableRow>
                <TableRow>
                  <TableRowColumn>
                    <b>Default Message Service SID</b>
                  </TableRowColumn>
                  <TableRowColumn>
                    {this.props.config.messageServiceSid}
                  </TableRowColumn>
                </TableRow>
              </TableBody>
            </Table>
          </CardText>
        )}
        {this.state.twilioError && (
          <CardText style={inlineStyles.errorBox}>
            {this.state.twilioError}
          </CardText>
        )}
        <CardText>
          <div className={css(styles.section)}>
            <span className={css(styles.sectionLabel)}>
              You can set Twilio API credentials specifically for this
              Organization by entering them here.
            </span>
            <GSForm
              schema={formSchema}
              onChange={this.onFormChange}
              onSubmit={this.handleSubmitTwilioAuthForm}
              defaultValue={this.state}
            >
              <Form.Field
                label="Twilio Account SID"
                name="accountSid"
                fullWidth
              />
              <Form.Field
                label="Twilio Auth Token"
                name="authToken"
                fullWidth
              />
              <Form.Field
                label="Default Message Service SID"
                name="messageServiceSid"
                fullWidth
              />

              <Form.Button
                label={this.props.saveLabel || "Save Twilio Credentials"}
                onClick={this.handleOpenTwilioDialog}
              />
              <Dialog
                actions={dialogActions}
                modal
                open={this.state.twilioDialogOpen}
              >
                Changing the Account SID or Messaging Service SID will break any
                campaigns that are currently running. Do you want to contunue?
              </Dialog>
            </GSForm>
          </div>
        </CardText>
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

export default OrgConfig;
