import type from "prop-types";
import React from "react";
import orderBy from "lodash/orderBy";
import Slider from "./Slider";
import Divider from "material-ui/Divider";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import OrganizationJoinLink from "./OrganizationJoinLink";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { dataTest } from "../lib/attributes";
import { dataSourceItem } from "./utils";

import sideboxes from "../integrations/texter-sideboxes/components";

export default class CampaignTexterUIForm extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData =
      (formValues.texterUIConfig.options &&
        JSON.parse(formValues.texterUIConfig.options)) ||
      {};
    this.state = settingsData;
  }

  onChange = formValues => {
    console.log("onChange", formValues);
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
    console.log("toggleChange", key, value);
    this.setState({ [key]: value }, () => {
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
    console.log("CampaignTexterUIForm", this.state, this.props.formValues);
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
          <Toggle
            {...dataTest(`toggle_${sb}`)}
            label={
              <div
                style={{ ...theme.text.secondaryHeader, marginBottom: "10px" }}
              >
                {displayName}
              </div>
            }
            toggled={this.state[sb]}
            onToggle={(toggler, val) => this.toggleChange(sb, val)}
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
          <Form.Button
            type="submit"
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
