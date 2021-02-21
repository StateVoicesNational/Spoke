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
    this.state = {};
    this.props.onAllSetChanged(false);
  }

  handleOpenTwilioDialog = () => this.setState({ twilioDialogOpen: true });

  handleCloseTwilioDialog = () => this.setState({ twilioDialogOpen: false });

  handleSubmitTwilioAuthForm = async ({
    accountSid,
    authToken,
    messageServiceSid
  }) => {
    // const res = await this.props.mutations.updateTwilioAuth(
    //   accountSid,
    //   authToken === "<Encrypted>" ? false : authToken,
    //   messageServiceSid
    // );
    // if (res.errors) {
    //   this.setState({ twilioError: res.errors.message });
    // } else {
    //   this.setState({ twilioError: undefined });
    // }
    // this.handleCloseTwilioDialog();
  };

  render() {
    const { inlineStyles, styles, organization } = this.props;
    const {
      twilioAccountSid,
      twilioAuthToken,
      twilioMessageServiceSid
    } = organization;
    const allSet =
      twilioAccountSid && twilioAuthToken && twilioMessageServiceSid;
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
              url={`${baseUrl}/twilio/${organization.id}`}
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
                accountSid: twilioAccountSid,
                authToken: twilioAuthToken,
                messageServiceSid: twilioMessageServiceSid
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
