import type from "prop-types";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import GSSubmitButton from "./forms/GSSubmitButton";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import * as yup from "yup";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import moment from "moment";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import AutoComplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

const formatTextingHours = hour => moment(hour, "H").format("h a");

const hourChoices = Array.from(Array(24)).map((_, hour) => {
  const formattedHour = formatTextingHours(hour);
  return {
    label: formattedHour,
    value: hour
  };
});

let timezones = [
  "US/Alaska",
  "US/Aleutian",
  "US/Arizona",
  "US/Central",
  "US/East-Indiana",
  "US/Eastern",
  "US/Hawaii",
  "US/Indiana-Starke",
  "US/Michigan",
  "US/Mountain",
  "US/Pacific",
  "US/Samoa",
  "America/Puerto_Rico",
  "America/Virgin"
];
if (typeof window !== "undefined") {
  if (window.TZ && timezones.indexOf(window.TZ) === -1) {
    const allTZs = momentTz.tz.names();
    const tzIndex = allTZs.indexOf(window.TZ);
    if (tzIndex !== -1) {
      timezones = allTZs.slice(Math.max(0, tzIndex - 5), tzIndex + 5);
    }
  }
}
const timezoneChoices = timezones.map(timezone => ({
  label: timezone,
  value: timezone
}));

export default class CampaignTextingHoursForm extends React.Component {
  state = {
    showForm: false,
    timezoneSearchText: undefined,
    textingHoursStartSearchText: undefined,
    textingHoursEndSearchText: undefined
  };

  formSchema = yup.object({
    overrideOrganizationTextingHours: yup.boolean(),
    textingHoursEnforced: yup.boolean(),
    textingHoursStart: yup.number().integer(),
    textingHoursEnd: yup.number().integer(),
    timezone: yup.string()
  });

  fireOnChangeIfTheFormValuesChanged(fieldName, newValue) {
    const formValues = cloneDeep(this.props.formValues);
    formValues[fieldName] = newValue;
    if (!isEqual(formValues, this.props.formValues)) {
      this.props.onChange(formValues);
    }
  }

  addToggleFormField(name, label) {
    return (
      <div>
        <Form.Field
          name={name}
          as={() => (
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  checked={this.props.formValues[name] || false}
                  onChange={async (_, isToggled) => {
                    this.fireOnChangeIfTheFormValuesChanged(name, isToggled);
                  }}
                />
              }
              label={label}
              labelPlacement="start"
            />
          )}
        />
      </div>
    );
  }

  addFormField(name, stateName, initialValue, label, hint, choices) {
    const previousChoise = choices.find(
      choise => choise.value === this.state[stateName]
    );
    return (
      <React.Fragment>
        <Form.Field
          as={() => (
            <AutoComplete
              fullWidth
              value={previousChoise || initialValue}
              options={choices}
              renderInput={params => {
                return (
                  <TextField {...params} label={label} placeholder={hint} />
                );
              }}
              getOptionLabel={({ label }) => label}
              getOptionSelected={(option, value) =>
                option.value === value.value
              }
              onChange={(event, value) => {
                let selectedChoice = value;
                if (!selectedChoice) {
                  return;
                }
                const state = {};
                state[stateName] = selectedChoice.value;
                this.setState(state);
                this.fireOnChangeIfTheFormValuesChanged(
                  name,
                  selectedChoice.value
                );
              }}
            />
          )}
          name={name}
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <GSForm
        schema={this.formSchema}
        value={this.props.formValues}
        onSubmit={this.props.onSubmit}
      >
        <CampaignFormSectionHeading
          title="Texting hours for campaign"
          subtitle="You can use the texting-hours configuration for your organization, or configure texting hours for this campaign."
        />

        {this.addToggleFormField(
          "overrideOrganizationTextingHours",
          "Override organization texting hours?"
        )}

        {this.addToggleFormField(
          "textingHoursEnforced",
          "Texting hours enforced?"
        )}
        {this.props.formValues.overrideOrganizationTextingHours ? (
          <div>
            {this.props.formValues.textingHoursEnforced ? (
              <div>
                {this.addFormField(
                  "textingHoursStart",
                  "textingHoursStartSearchText",
                  {
                    value: this.props.formValues.textingHoursStart,
                    label: formatTextingHours(
                      this.props.formValues.textingHoursStart
                    )
                  },
                  "Start time",
                  "",
                  hourChoices
                )}

                {this.addFormField(
                  "textingHoursEnd",
                  "textingHoursEndSearchText",
                  {
                    value: this.props.formValues.textingHoursEnd,
                    label: formatTextingHours(
                      this.props.formValues.textingHoursEnd
                    )
                  },
                  "End time",
                  "",
                  hourChoices
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        <div>
          Timezone to use for contacts without ZIP code and to determine
          daylight savings
        </div>
        {this.addFormField(
          "timezone",
          "timezoneSearchText",
          {
            value: this.props.formValues.timezone,
            label: this.props.formValues.timezone
          },
          "Default Contact Timezone",
          "",
          timezoneChoices
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

CampaignTextingHoursForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object
};
