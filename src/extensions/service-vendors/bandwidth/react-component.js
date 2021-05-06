/* eslint no-console: 0 */
import { css } from "aphrodite";
import { CardText, Card, CardHeader } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { Table, TableBody, TableRow, TableRowColumn } from "material-ui/Table";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import theme from "../../../styles/theme";
import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    const {
      userName,
      password,
      accountId,
      siteId,
      sipPeerId,
      applicationId
    } = this.props.config;
    const allSet =
      userName && password && accountId && siteId && sipPeerId && applicationId;
    this.state = { allSet, ...this.props.config, country: "United States" };
    this.props.onAllSetChanged(allSet);
  }

  /*
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
  */
  onFormChange = value => {
    this.setState(value);
  };

  handleOpenDialog = () => this.setState({ dialogOpen: true });

  handleCloseDialog = () => this.setState({ dialogOpen: false });

  handleSubmitAuthForm = async () => {
    const { password, dialogOpen, error, ...config } = this.state;
    if (password !== "<Encrypted>") {
      config.password = password;
    }
    let newError;
    try {
      await this.props.onSubmit(config);
      this.setState({
        error: undefined
      });
    } catch (caught) {
      console.log("Error submitting Bandwidth settings", caught);
      if (caught.graphQLErrors && caught.graphQLErrors.length > 0) {
        const errors = caught.graphQLErrors.map(error => error.message);
        newError = errors.join(",");
      } else {
        newError = caught.message;
      }
      this.setState({ error: newError });
    }
    this.handleCloseDialog();
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
      accountId: yup
        .string()
        .nullable()
        .max(64),
      userName: yup
        .string()
        .nullable()
        .max(64),
      password: yup
        .string()
        .nullable()
        .max(64),
      siteId: yup
        .string()
        .nullable()
        .max(64),
      sipPeerId: yup
        .string()
        .nullable()
        .max(64),
      applicationId: yup
        .string()
        .nullable()
        .max(64),
      houseNumber: yup.string().nullable(),
      streetName: yup.string().nullable(),
      city: yup.string().nullable(),
      stateCode: yup.string().nullable(),
      zip: yup.string().nullable(),
      country: yup.string().nullable()
    });

    const dialogActions = [
      <FlatButton
        label="Cancel"
        style={inlineStyles.dialogButton}
        onClick={this.handleCloseDialog}
      />,
      <Form.Submit
        as={GSSubmitButton}
        label="Save"
        style={inlineStyles.dialogButton}
        component={GSSubmitButton}
        onClick={this.handleSubmitAuthForm}
      />
    ];

    return (
      <div>
        {allSet && (
          <CardText style={inlineStyles.shadeBox}>
            Settings for this organization:
            <Table selectable={false} bodyStyle={{ "background-color": "red" }}>
              <TableBody
                displayRowCheckbox={false}
                style={inlineStyles.shadeBox}
              >
                <TableRow>
                  <TableRowColumn>
                    <b>Account ID</b>
                  </TableRowColumn>
                  <TableRowColumn>{this.props.config.accountId}</TableRowColumn>
                </TableRow>
                <TableRow>
                  <TableRowColumn>
                    <b>Username</b>
                  </TableRowColumn>
                  <TableRowColumn>{this.props.config.userName}</TableRowColumn>
                </TableRow>
                <TableRow>
                  <TableRowColumn>
                    <b>Password</b>
                  </TableRowColumn>
                  <TableRowColumn>{this.props.config.password}</TableRowColumn>
                </TableRow>
                {this.props.config.siteId ? (
                  <TableRow>
                    <TableRowColumn>
                      <b>Application Info</b>
                    </TableRowColumn>
                    <TableRowColumn>
                      Site (or Sub-account) id: {this.props.config.siteId}
                      <br />
                      Location (or Sip-peer): {this.props.config.sipPeerId}
                      <br />
                      Application Id: {this.props.config.applicationId}
                    </TableRowColumn>
                  </TableRow>
                ) : null}
                {this.props.config.streetName ? (
                  <TableRow>
                    <TableRowColumn>
                      <b>Address</b>
                    </TableRowColumn>
                    <TableRowColumn>
                      {this.props.config.houseNumber}{" "}
                      {this.props.config.streetName}
                      <br />
                      {this.props.config.city}, {this.props.config.stateCode}{" "}
                      {this.props.config.zip}
                      <br />
                      {this.props.config.country || ""}
                    </TableRowColumn>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardText>
        )}
        {this.state.error && (
          <CardText style={inlineStyles.errorBox}>{this.state.error}</CardText>
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
              defaultValue={this.state}
            >
              <Form.Field
                as={GSTextField}
                label="Account Id"
                name="accountId"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Username (for API)"
                name="userName"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Password"
                name="password"
                fullWidth
              />
              <div>
                {this.props.config.sipPeerId ? null : (
                  <Card expanded>
                    <CardHeader
                      title="Address"
                      style={{ backgroundColor: theme.colors.lightGray }}
                      actAsExpander
                      showExpandableButton
                    />
                    <CardText expandable>
                      <div>
                        In order to setup your Bandwidth account we need your
                        organization&rsquo;s billing address. If you have
                        already created a subaccount (Bandwidth sometimes calls
                        this a 'Site') and a 'Location' (also called a
                        'SipPeer'), then click <b>Advanced</b> and you can fill
                        in the information. Otherwise, just fill out the address
                        and we&rsquo;ll set it all up for you.
                      </div>
                      <Form.Field
                        as={GSTextField}
                        label="House number"
                        name="houseNumber"
                      />
                      <Form.Field
                        as={GSTextField}
                        label="Street Name"
                        name="streetName"
                      />
                      <Form.Field
                        as={GSTextField}
                        label="State code"
                        name="stateCode"
                      />
                      <Form.Field as={GSTextField} label="City" name="city" />
                      <Form.Field as={GSTextField} label="Zip" name="zip" />
                      <Form.Field
                        as={GSTextField}
                        label="Country"
                        name="country"
                      />
                    </CardText>
                  </Card>
                )}
                <Card expandable initiallyExpanded={false}>
                  <CardHeader
                    title={"Advanced"}
                    actAsExpander
                    showExpandableButton
                    style={{ backgroundColor: theme.colors.lightGray }}
                  />
                  <CardText expandable>
                    <p>
                      Anything not filled out, we will auto-create for you. If
                      you do not provide a <b>Location Id</b>, then you need to
                      fill in the address fields above.
                    </p>

                    <Form.Field
                      as={GSTextField}
                      label="Site/Sub-account Id"
                      name="siteId"
                    />
                    <Form.Field
                      as={GSTextField}
                      label="Sip Peer/Location Id"
                      name="sipPeerId"
                    />
                    <Form.Field
                      as={GSTextField}
                      label="Application Id"
                      name="applicationId"
                    />
                  </CardText>
                </Card>
              </div>
              <Form.Submit
                as={GSSubmitButton}
                label={this.props.saveLabel || "Save Credentials"}
                onClick={this.handleOpenDialog}
              />
              <Dialog
                actions={dialogActions}
                modal
                open={this.state.dialogOpen}
              >
                Changing information here will break any campaigns that are
                currently running. Do you want to contunue?
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
