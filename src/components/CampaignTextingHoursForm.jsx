import type from "prop-types";
import Toggle from "material-ui/Toggle";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import GSSubmitButton from "./forms/GSSubmitButton";
import GSTextField from "./forms/GSTextField";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import * as yup from "yup";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import moment from "moment";
import momentTz from "moment-timezone";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

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
      <Form.Field
        name={name}
        as={Toggle}
        defaultToggled={this.props.formValues[name]}
        label={label}
        onToggle={async (_, isToggled) => {
          this.fireOnChangeIfTheFormValuesChanged(name, isToggled);
        }}
      />
    );
  }

  addFormField(name, stateName, initialValue, label, hint, choices) {
    return (
      <Form.Field
        as={SelectField}
        name={name}
        floatingLabelText={label}
        onChange={(_, i, val) => {
          this.props.onChange({ [name]: val });
        }}
      >
        {choices}
      </Form.Field>
    );
  }

  render() {
    const formatTextingHours = hour => moment(hour, "H").format("h a");
    const hours = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23
    ];
    const hourChoices = hours.map(hour => {
      const formattedHour = formatTextingHours(hour);
      return <MenuItem key={hour} value={hour} primaryText={formattedHour} />;
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
    if (window.TZ && timezones.indexOf(window.TZ) === -1) {
      const allTZs = momentTz.tz.names();
      const tzIndex = allTZs.indexOf(window.TZ);
      if (tzIndex !== -1) {
        timezones = allTZs.slice(Math.max(0, tzIndex - 5), tzIndex + 5);
      }
    }
    const timezoneChoices = timezones.map(timezone => (
      <MenuItem key={timezone} value={timezone} primaryText={timezone} />
    ));
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
                  formatTextingHours(this.props.formValues.textingHoursStart),
                  "Start time",
                  "",
                  hourChoices
                )}

                {this.addFormField(
                  "textingHoursEnd",
                  "textingHoursEndSearchText",
                  formatTextingHours(this.props.formValues.textingHoursEnd),
                  "End time",
                  "",
                  hourChoices
                )}
              </div>
            ) : (
              ""
            )}
          </div>
        ) : null}
        <div>
          Timezone to use for contacts without ZIP code and to determine
          daylight savings
        </div>
        {this.addFormField(
          "timezone",
          "timezoneSearchText",
          this.props.formValues.timezone,
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
