/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSelectField from "../../../components/forms/GSSelectField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const formSchema = yup.object({
      NGP_VAN_API_KEY_ENCRYPTED: yup
        .string()
        .max(64)
        .notRequired()
        .nullable(),
      NGP_VAN_APP_NAME: yup
        .string()
        .max(32)
        .notRequired()
        .nullable(),
      NGP_VAN_DATABASE_MODE: yup
        .number()
        .oneOf([0, 1, null])
        .nullable()
        .transform(val => (isNaN(val) ? null : val))
    });
    return (
      <div>
        <GSForm
          schema={formSchema}
          defaultValue={this.props.serviceManagerInfo.data}
          onSubmit={x => {
            this.props.onSubmit(x);
          }}
        >
          <Form.Field
            as={GSTextField}
            label="NGPVAN API Key"
            name="NGP_VAN_API_KEY_ENCRYPTED"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            label="NGPVAN App Name"
            name="NGP_VAN_APP_NAME"
            fullWidth
          />
          <Form.Field
            as={GSSelectField}
            label="NGP VAN Database Mode"
            name="NGP_VAN_DATABASE_MODE"
            choices={[
              { value: "", label: "" },
              { value: "0", label: "My Voters" },
              { value: "1", label: "My Campaign" }
            ]}
            style={{ width: "100%" }}
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
