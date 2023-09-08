/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const formSchema = yup.object({
      NGP_VAN_API_KEY: yup
        .string()
        .nullable()
        .max(64),
      NGP_VAN_APP_NAME: yup
        .string()
        .nullable()
        .max(64),
      NGP_VAN_WEBHOOK_BASE_URL: yup
        .string()
        .nullable()
        .max(64)
    });
    return (
      <div>
        You can set VAN credentials specifically for this Organization by
        entering them here.
        <GSForm
          schema={formSchema}
          defaultValue={this.props.serviceManagerInfo.data}
          onSubmit={x => {
            console.log("onSubmit", x);
            this.props.onSubmit(x);
          }}
        >
          <Form.Field
            as={GSTextField}
            label="Api Key"
            name="NGP_VAN_API_KEY"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            label="App Name"
            name="NGP_VAN_APP_NAME"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            label="Webhook Base URL"
            name="NGP_VAN_WEBHOOK_BASE_URL"
            fullWidth
          />
          <Form.Submit
            as={GSSubmitButton}
            label="Save"
            style={this.props.inlineStyles.dialogButton}
          />
        </GSForm>
      </div>
    );
  }
}

OrgConfig.propTypes = {
  organizationId: PropTypes.string,
  serviceManagerInfo: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
