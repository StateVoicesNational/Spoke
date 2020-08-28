import type from "prop-types";
import Toggle from "material-ui/Toggle";
import React from "react";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import yup from "yup";
import cloneDeep from "lodash/cloneDeep";
import isEqual from "lodash/isEqual";
import moment from "moment";
import Autocomplete from "material-ui/AutoComplete";
import { dataSourceItem } from "./utils";

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
        type={Toggle}
        defaultToggled={this.props.formValues[name]}
        label={label}
        onToggle={async (_, isToggled) => {
          this.fireOnChangeIfTheFormValuesChanged(name, isToggled);
        }}
      />
    );
  }

  addAutocompleteFormField(
    name,
    stateName,
    initialValue,
    label,
    hint,
    choices
  ) {
    return (
      <Form.Field
        name={name}
        type={Autocomplete}
        fullWidth
        dataSource={choices}
        filter={Autocomplete.caseInsensitiveFilter}
        maxSearchResults={4}
        searchText={
          this.state[stateName] !== undefined
            ? this.state[stateName]
            : initialValue
        }
        hintText={hint}
        floatingLabelText={label}
        onUpdateInput={text => {
          const state = {};
          state[stateName] = text;
          this.setState(state);
        }}
        onNewRequest={(selection, index) => {
          let selectedChoice = undefined;
          if (index === -1) {
            selectedChoice = choices.find(item => item.text === selection);
          } else {
            selectedChoice = selection;
          }
          if (!selectedChoice) {
            return;
          }
          const state = {};
          state[stateName] = selectedChoice.text;
          this.setState(state);
          this.fireOnChangeIfTheFormValuesChanged(
            name,
            selectedChoice.rawValue
          );
        }}
      />
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
      return dataSourceItem(formattedHour, hour);
    });

    const timezones = [
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
    const timezoneChoices = timezones.map(timezone =>
      dataSourceItem(timezone, timezone)
    );

    return (
      <GSForm
        schema={this.formSchema}
        value={this.props.formValues}
        onChange={this.props.onChange}
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

        {this.props.formValues.overrideOrganizationTextingHours ? (
          <div>
            {this.addToggleFormField(
              "textingHoursEnforced",
              "Texting hours enforced?"
            )}

            {this.props.formValues.textingHoursEnforced ? (
              <div>
                {this.addAutocompleteFormField(
                  "textingHoursStart",
                  "textingHoursStartSearchText",
                  formatTextingHours(this.props.formValues.textingHoursStart),
                  "Start time",
                  "Start typing a start time",
                  hourChoices,
                  hours
                )}

                {this.addAutocompleteFormField(
                  "textingHoursEnd",
                  "textingHoursEndSearchText",
                  formatTextingHours(this.props.formValues.textingHoursEnd),
                  "End time",
                  "Start typing an end time",
                  hourChoices,
                  hours
                )}
              </div>
            ) : (
              ""
            )}
          </div>
        ) : (
          ""
        )}

        {this.addAutocompleteFormField(
          "timezone",
          "timezoneSearchText",
          this.props.formValues.timezone,
          "Timezone to use for contacts without ZIP code and to determine daylight savings",
          "Start typing a timezone",
          timezoneChoices,
          timezones
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

CampaignTextingHoursForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object
};
