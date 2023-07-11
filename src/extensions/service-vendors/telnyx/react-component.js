/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable import/prefer-default-export */
import { css } from "aphrodite";
import React from 'react'
import Form from "react-formal";
import PropTypes from "prop-types";
import * as yup from "yup";

import CardContent from "@material-ui/core/CardContent";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";

import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    const { messagingProfileId } = this.props.config || {}
    const allSet = messagingProfileId
    this.state = { ...this.props.config, telnyxDialogOpen: false };
    this.props.onAllSetChanged(allSet);
  };

  componentDidUpdate(prevProps) {
    const { messagingProfileId: prevMessagingProfileId } = prevProps.config || {}
    const prevAllSet = prevMessagingProfileId
    const { messagingProfileId } = this.props.config || {}
    const allSet = messagingProfileId

    if (!!prevAllSet !== !!allSet) {
      this.props.onAllSetChanged(allSet);
    }

  }

  onFormChange = value => {
    this.setState(value);
  };

  handleOpenTelnyxDialog = () => this.setState({ telnyxDialogOpen: true });

  handleCloseTelnyxDialog = () => this.setState({ telnyxDialogOpen: false });

  handleSubmitTelnyxForm = async () => {
    const { messagingProfileId } = this.state
    let telnyxError
    try {
      await this.props.onSubmit({
        messagingProfileId
      })
      //TODO: is this needed?
      await this.props.requestRefetch();
      this.setState({
        telnyxError: undefined
      })
    } catch (caught) {
      console.log("Error submitting Telnyx form", JSON.stringify(caught));
      if (caught.graphQLErrors && caught.graphQLErrors.length > 0) {
        const telnyxErrors = caught.graphQLErrors.map(error => error.message);
        telnyxError = telnyxErrors.join(",");
      } else {
        telnyxError = caught.message;
      }
      this.setState({ telnyxError });
    }
    this.handleCloseTelnyxDialog();
  }

  render() {
    const { inlineStyles, styles, config } = this.props;
    const { messagingProfileId } = config || {};
    const allSet = messagingProfileId
    // let baseUrl = "http://base";
    // if (typeof window !== "undefined") {
    //   baseUrl = window.location.origin;
    // }
    const formSchema = yup.object({
      messagingProfileId: yup
        .string()
        .nullable()
        .max(64),
    })
    return (
      <div>
        {allSet && (
          <CardContent style={inlineStyles.shadeBox}>
            {/* <DisplayLink
              url={`${baseUrl}/twilio/${organizationId}`}
              textContent="Twilio credentials are configured for this organization. You should set the inbound Request URL in your Twilio messaging service to this link."
            /> */}
            Settings for this organization:
            <TableContainer>
              <Table style={{ "backgroundColor": "red" }}>
                <TableBody
                  // displayRowCheckbox={false}
                  style={inlineStyles.shadeBox}
                >
                  <TableRow>
                    <TableCell>
                      <b>Telnyx Messaging Profile ID</b>
                    </TableCell>
                    <TableCell>{this.props.config.messagingProfileId}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}
        {this.state.telnyxError && (
          <CardContent style={inlineStyles.errorBox}>
            {this.state.telnyxError}
          </CardContent>
        )}
        <CardContent>
          <div className={css(styles.section)}>
            <span className={css(styles.sectionLabel)}>
              You can set up a Telxy Messaging Profile ID specifically for this
              Organization by entering it here.
            </span>
            <GSForm
              schema={formSchema}
              onChange={this.onFormChange}
              defaultValue={this.state}
            >
              <Form.Field
                as={GSTextField}
                label="Messaging Profile ID"
                name="messagingProfileId"
                fullWidth
              />

              <Button
                color="primary"
                variant="contained"
                onClick={this.handleOpenTelnyxDialog}
              >
                {this.props.saveLabel || "Save Telnyx Config"}
              </Button>
              <Dialog open={this.state.telnyxDialogOpen}>
                <DialogContent>
                  <DialogContentText>
                    Changing the Messaging Profile ID will break
                    any campaigns that are currently running. Do you want to
                    continue?
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button
                    style={inlineStyles.dialogButton}
                    onClick={this.handleCloseTelnyxDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={this.handleSubmitTelnyxForm}
                  >
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </GSForm>
          </div>
        </CardContent>
      </div>
    )
  }
}


OrgConfig.propTypes = {
  // organizationId: PropTypes.string,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  config: PropTypes.object,
  messagingProfileId: PropTypes.string,
  onAllSetChanged: PropTypes.func,
  requestRefetch: PropTypes.func,
  onSubmit: PropTypes.func
}