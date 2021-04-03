import type from "prop-types";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSSubmitButton from "./forms/GSSubmitButton";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import * as yup from "yup";
import cloneDeep from "lodash/cloneDeep";

export default class CampaignMessagingServiceForm extends React.Component {
  formSchema = yup.object({
    useOwnMessagingService: yup.boolean(),
    messageserviceSid: yup
      .string()
      .transform(value => (!value ? null : value))
      .nullable()
  });

  toggled(name, isToggled) {
    const formValues = cloneDeep(this.props.formValues);
    formValues[name] = isToggled;
    this.props.onChange(formValues);
  }

  addToggleFormField(name, label) {
    return (
      <div>
        <Form.Field
          as={props => (
            <FormControlLabel
              color="primary"
              control={
                <Switch
                  checked={this.props.formValues[name]}
                  onChange={async (_, isToggled) => {
                    this.toggled(name, isToggled);
                  }}
                />
              }
              labelPlacement="start"
              label={label}
            />
          )}
          name={name}
        />
      </div>
    );
  }

  render() {
    return (
      <GSForm
        schema={this.formSchema}
        value={this.props.formValues}
        onChange={this.props.onChange}
        onSubmit={this.props.onSubmit}
      >
        <CampaignFormSectionHeading
          title="Messaging Service Details for Campaign"
          subtitle="You can use the messaging service configuration to modify advanced settings for this campaign."
        />

        {this.addToggleFormField(
          "useOwnMessagingService",
          "Create a new Messaging Service for this Campaign?"
        )}

        {this.props.formValues.useOwnMessagingService && (
          <div>
            <Form.Field
              as={GSTextField}
              name="messageserviceSid"
              label="Messaging Service SID"
              fullWidth
            />
            <label>
              Leave this blank to automatically create a messaging service
            </label>
          </div>
        )}

        <Form.Submit
          as={GSSubmitButton}
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    );
  }
}

CampaignMessagingServiceForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object,
  ensureComplete: type.bool
};
