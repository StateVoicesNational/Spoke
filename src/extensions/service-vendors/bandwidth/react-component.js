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
import withMuiTheme from "../../../containers/hoc/withMuiTheme";

export class OrgConfigBase extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...this.props.config, country: "United States" };
    const allSet = this.isAllSet();
    this.props.onAllSetChanged(allSet);
    console.log("constructor");
  }

  isAllSet() {
    const {
      userName,
      password,
      accountId,
      siteId,
      sipPeerId,
      applicationId
    } = this.props.config;
    return Boolean(
      userName && password && accountId && siteId && sipPeerId && applicationId
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    // new results after saving first setup
    const newData = {};
    if (
      nextProps.config.siteId &&
      this.props.config.siteId !== this.state.siteId
    ) {
      newData.siteId = nextProps.config.sipPeerId;
    }
    if (
      nextProps.config.sipPeerId &&
      this.props.config.sipPeerId !== this.state.sipPeerId
    ) {
      newData.sipPeerId = nextProps.config.sipPeerId;
    }
    if (
      nextProps.config.applicationId &&
      this.props.config.applicationId !== this.state.applicationId
    ) {
      newData.applicationId = nextProps.config.applicationId;
    }
    if (Object.values(newData).length) {
      this.setState(newData);
    }
  }

  onFormChange = value => {
    this.setState(value);
  };

  handleOpenDialog = () => {
    console.log("bandwidth.handleopendialog", this.state);
    this.setState({ dialogOpen: true });
  };

  handleCloseDialog = () => this.setState({ dialogOpen: false });

  handleSubmitAuthForm = async () => {
    const { password, dialogOpen, error, ...config } = this.state;
    if (password !== "<Encrypted>") {
      config.password = password;
    }
    let newError;
    this.handleCloseDialog();
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
  };

  render() {
    const { organizationId, inlineStyles, styles, config } = this.props;
    const allSet = this.isAllSet();
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
              You can set Bandwidth API credentials specifically for this
              Organization by entering them here.
            </span>
            <GSForm
              schema={formSchema}
              onChange={this.onFormChange}
              onSubmit={this.handleOpenDialog}
              value={this.state}
            >
              <Form.Field
                as={GSTextField}
                label="Account Id"
                name="accountId"
                fullWidth
              />
              <Form.Field
                as={GSTextField}
                label="Username (for API, probably an email address)"
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
                        backgroundColor: this.props.muiTheme.palette.grey[300]
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
                      backgroundColor: this.props.muiTheme.palette.grey[300]
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
                      <div>
                        {document.location.hostname === "localhost" ? (
                          <span>
                            You will need to deploy somewhere with a publicly
                            accessible url
                          </span>
                        ) : (
                          <span>
                            <div>
                              If you create the application manually, set the
                              Callback URL to:{" "}
                            </div>
                            <code>
                              {document.location.protocol}
                              {"//"}
                              {document.location.hostname}/bandwidth/
                              {organizationId}
                            </code>
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Collapse>
                </Card>
              </div>
              <Form.Submit
                fullWidth
                maxWidth="md"
                as={GSSubmitButton}
                label={this.props.saveLabel || "Save Credentials"}
              />
              {config.autoConfigError && (
                <CardContent style={inlineStyles.errorBox}>
                  {config.autoConfigError}
                </CardContent>
              )}
              <Dialog open={this.state.dialogOpen || false}>
                <DialogContent>
                  <DialogContentText>
                    Changing information here will break any campaigns that are
                    currently running. Do you want to continue?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleSubmitAuthForm}
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

OrgConfigBase.propTypes = {
  organizationId: PropTypes.string,
  config: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onAllSetChanged: PropTypes.func,
  requestRefetch: PropTypes.func
};

export const OrgConfig = withMuiTheme(OrgConfigBase);
