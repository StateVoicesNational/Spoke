import { css } from "aphrodite";
import { CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
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
    this.state = { allSet };
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

  handleOpenTwilioDialog = () => this.setState({ twilioDialogOpen: true });

  handleCloseTwilioDialog = () => this.setState({ twilioDialogOpen: false });

  handleSubmitTwilioAuthForm = async ({
    accountSid,
    authToken,
    messageServiceSid
  }) => {
    try {
      const res = await this.props.onSubmit({
        twilioAccountSid: accountSid,
        twilioAuthToken: authToken === "<Encrypted>" ? false : authToken,
        twilioMessageServiceSid: messageServiceSid
      });
      if (res.errors) {
        this.setState({ twilioError: res.errors.message });
      } else {
        this.setState({ twilioError: undefined });
      }
    } catch (caught) {
      console.log("caught", typeof caught, JSON.stringify(caught));
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
          </CardText>
        )}
        {this.state.twilioError && (
          <CardText style={inlineStyles.shadeBox}>
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
              defaultValue={{
                accountSid,
                authToken,
                messageServiceSid
              }}
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
  onAllSetChanged: PropTypes.func
};

export default OrgConfig;
