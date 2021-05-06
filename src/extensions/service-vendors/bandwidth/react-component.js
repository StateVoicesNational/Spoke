/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Collapse from "@material-ui/core/Collapse";
import IconButton from "@material-ui/core/IconButton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";

import theme from "../../../styles/theme";
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
      await this.props.requestRefetch();
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

    return (
      <div>
        {allSet && (
          <CardContent style={inlineStyles.shadeBox}>
            Settings for this organization:
            <TableContainer>
              <Table style={{ "background-color": "red" }}>
                <TableBody style={inlineStyles.shadeBox}>
                  <TableRow>
                    <TableCell>
                      <b>Account ID</b>
                    </TableCell>
                    <TableCell>{this.props.config.accountId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Username</b>
                    </TableCell>
                    <TableCell>{this.props.config.userName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <b>Password</b>
                    </TableCell>
                    <TableCell>{this.props.config.password}</TableCell>
                  </TableRow>
                  {this.props.config.siteId && (
                    <TableRow>
                      <TableCell>
                        <b>Application Info</b>
                      </TableCell>
                      <TableCell>
                        Site (or Sub-account) id: {this.props.config.siteId}
                        <br />
                        Location (or Sip-peer): {this.props.config.sipPeerId}
                        <br />
                        Application Id: {this.props.config.applicationId}
                      </TableCell>
                    </TableRow>
                  )}
                  {this.props.config.streetName && (
                    <TableRow>
                      <TableCell>
                        <b>Address</b>
                      </TableCell>
                      <TableCell>
                        {this.props.config.houseNumber}{" "}
                        {this.props.config.streetName}
                        <br />
                        {this.props.config.city}, {this.props.config.stateCode}{" "}
                        {this.props.config.zip}
                        <br />
                        {this.props.config.country || ""}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
        {this.state.error && (
          <CardContent style={inlineStyles.errorBox}>
            {this.state.error}
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
                  <Card>
                    <CardHeader
                      title="Address"
                      style={{
                        cursor: "pointer",
                        backgroundColor: theme.colors.lightGray
                      }}
                      action={
                        <IconButton>
                          <ExpandMoreIcon />
                        </IconButton>
                      }
                      onClick={() =>
                        this.setState({
                          advancedCollapse: !this.state.advancedCollapse
                        })
                      }
                    />
                    <Collapse
                      in={this.state.advancedCollapse}
                      timeout="auto"
                      unmountOnExit
                    >
                      <CardContent>
                        <div>
                          In order to setup your Bandwidth account we need your
                          organization&rsquo;s billing address. If you have
                          already created a subaccount (Bandwidth sometimes
                          calls this a 'Site') and a 'Location' (also called a
                          'SipPeer'), then click <b>Advanced</b> and you can
                          fill in the information. Otherwise, just fill out the
                          address and we&rsquo;ll set it all up for you.
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
                      </CardContent>
                    </Collapse>
                  </Card>
                )}
                <Card>
                  <CardHeader
                    title={"Advanced"}
                    style={{
                      cursor: "pointer",
                      backgroundColor: theme.colors.lightGray
                    }}
                    action={
                      <IconButton>
                        <ExpandMoreIcon />
                      </IconButton>
                    }
                    onClick={() =>
                      this.setState({
                        advancedCollapse: !this.state.advancedCollapse
                      })
                    }
                  />
                  <Collapse
                    in={this.state.advancedCollapse}
                    timeout="auto"
                    unmountOnExit
                  >
                    <CardContent>
                      <p>
                        Anything not filled out, we will auto-create for you. If
                        you do not provide a <b>Location Id</b>, then you need
                        to fill in the address fields above.
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
                    </CardContent>
                  </Collapse>
                </Card>
              </div>
              <Form.Submit
                fullWidth
                maxWidth="md"
                as={GSSubmitButton}
                label={this.props.saveLabel || "Save Credentials"}
                onClick={this.handleOpenDialog}
              />
              <Dialog open={this.state.dialogOpen}>
                <DialogContent>
                  <DialogContentText>
                    Changing information here will break any campaigns that are
                    currently running. Do you want to contunue?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Form.Submit
                    as={GSSubmitButton}
                    label="Save"
                    style={inlineStyles.dialogButton}
                    component={GSSubmitButton}
                    onClick={this.handleSubmitAuthForm}
                  />
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
