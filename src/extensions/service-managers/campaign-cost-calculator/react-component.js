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
    console.log("campaign-cost-calculator OrgConfig", this.props);
    const formSchema = yup.object({
      outboundCost: yup
        .number()
        .nullable()
        .positive(),
      inboundCost: yup
        .number()
        .nullable()
        .positive(),
      currency: yup
        .string()
        .max(3)
        .nullable()
        .uppercase()
    });
    return (
      <div>
        Set the currency and cost per inbound and outbound SMS message segment
        here to show SMS costs in the campaign stats section
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
            label="Cost per outbound SMS segment (eg. 0.0075)"
            name="outboundCost"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            label="Cost per inbound SMS segment (eg. 0.00049)"
            name="inboundCost"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            label="Currency (eg. AUD, EUR, USD, etc.)"
            name="currency"
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
