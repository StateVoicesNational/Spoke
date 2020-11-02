import type from "prop-types";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import yup from "yup";
import cloneDeep from "lodash/cloneDeep";
import Toggle from "material-ui/Toggle";

export default class CampaignBudgetForm extends React.Component {
  formSchema = yup.object({
    outgoingMessageCost: yup.number(),
    incomingMessageCost: yup.number(),
    budget: yup.number(),
    useBudget: yup.boolean()
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
          title="Campaign Budget and Messaging Costs"
          subtitle="Estimate your messaging costs and set a budget
          "
        />

        {this.addToggleFormField(
          "useBudget",
          "Use a budget to estimate messaging costs?"
        )}

        {this.props.formValues.useBudget ? (
          <div>
            <Form.Field
              name="outgoingMessageCost"
              label="Outgoing Message Cost ($)"
              fullWidth
            />
            <label>
              An estimate of how much you expect each outgoing message to cost
            </label>
            <Form.Field
              name="incomingMessageCost"
              label="Incoming Message Cost ($)"
              fullWidth
            />
            <label>
              An estimate of how much you expect each incoming message to cost
            </label>
            <Form.Field name="budget" label="Campaign Budget ($)" fullWidth />
            <label>
              Approximate amount of how much to spend on this campaign.
            </label>
          </div>
        ) : (
          ""
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

CampaignBudgetForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object,
  ensureComplete: type.bool
};
