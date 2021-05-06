import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import * as yup from "yup";
import Form from "react-formal";
import { dataTest } from "../lib/attributes";
import sideboxes from "../extensions/texter-sideboxes/components";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

export default class CampaignTexterUIForm extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData =
      (formValues.texterUIConfig.options &&
        JSON.parse(formValues.texterUIConfig.options)) ||
      {};
    // default sideboxes should be enabled until they're explicitly turned off
    formValues.texterUIConfig.sideboxChoices.forEach(sb => {
      if (sb.startsWith("default") && !settingsData.hasOwnProperty(sb)) {
        settingsData[sb] = true;
      }
    });
    this.state = settingsData;
  }

  onChange = formValues => {
    this.setState(formValues, () => {
      this.props.onChange({
        texterUIConfig: {
          options: JSON.stringify(this.state),
          sideboxChoices: this.props.formValues.texterUIConfig.sideboxChoices
        }
      });
    });
  };

  toggleChange = (key, value) => {
    this.setState({ [key]: value }, newData => {
      this.props.onChange({
        texterUIConfig: {
          options: JSON.stringify(this.state),
          sideboxChoices: this.props.formValues.texterUIConfig.sideboxChoices
        }
      });
    });
  };

  render() {
    const keys = Object.keys(sideboxes);
    const adminItems = [];
    const schemaObject = {};
    keys.forEach(sb => {
      const sidebox = sideboxes[sb];
      const displayName = sidebox.displayName();
      const AdminConfig = (this.state[sb] && sidebox.AdminConfig) || null;
      if (sidebox.adminSchema) {
        Object.assign(schemaObject, sidebox.adminSchema());
      }
      schemaObject[sb] = yup.boolean();
      adminItems.push(
        <div key={sb}>
          <FormControlLabel
            control={
              <Switch
                {...dataTest(`toggle_${sb}`)}
                color="primary"
                checked={this.state[sb] || false}
                onChange={(toggler, val) => this.toggleChange(sb, val)}
              />
            }
            label={displayName}
            labelPlacement="start"
          />
          {AdminConfig ? (
            <div style={{ paddingLeft: "15px" }}>
              <AdminConfig
                settingsData={this.state}
                onToggle={this.toggleChange}
                organization={this.props.organization}
              />
            </div>
          ) : null}
          <div style={{ height: "20px" }}></div>
        </div>
      );
    });
    return (
      <div>
        <GSForm
          schema={yup.object(schemaObject)}
          value={this.state}
          onChange={this.onChange}
        >
          {adminItems}
          <Form.Submit
            as={GSSubmitButton}
            onClick={this.props.onSubmit}
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
            {...dataTest("submitCampaignTexterUIForm")}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignTexterUIForm.propTypes = {
  formValues: type.object,
  organization: type.object,
  onChange: type.func,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
