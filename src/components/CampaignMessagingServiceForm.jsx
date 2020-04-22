import type from "prop-types";
import Toggle from "material-ui/Toggle";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import yup from "yup";
import cloneDeep from "lodash/cloneDeep";

export default class CampaignMessagingServiceForm extends React.Component {
  formSchema = yup.object({
    useOwnMessagingService: yup.boolean()
  });

  toggled(name, isToggled) {
    const formValues = cloneDeep(this.props.formValues);
    formValues[name] = isToggled;
    this.props.onChange(formValues);
  }

  addToggleFormField(name, label) {
    return (
      <Form.Field
        name={name}
        type={Toggle}
        defaultToggled={this.props.formValues[name]}
        label={label}
        onToggle={async (_, isToggled) => {
          this.toggled(name, isToggled);
        }}
      />
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

        <Form.Button
          type="submit"
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
