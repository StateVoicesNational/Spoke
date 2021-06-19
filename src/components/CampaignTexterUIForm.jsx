import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import * as yup from "yup";
import Form from "react-formal";

import Switch from "@material-ui/core/Switch";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Collapse from "@material-ui/core/Collapse";

import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import { dataTest } from "../lib/attributes";
import sideboxes from "../extensions/texter-sideboxes/components";
import theme from "../styles/mui-theme";

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing(2)
  }
});

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

  /**
   * if a sidebox has default values they should emit them on mount
   * and they will be properly set on mount of this component
   */
  collectedDefaults = {};

  componentDidMount() {
    this.setState(this.collectedDefaults);
  }

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
        <Card className={css(styles.card)} key={sb}>
          <CardHeader
            title={displayName}
            action={
              <Switch
                {...dataTest(`toggle_${sb}`)}
                color="primary"
                checked={this.state[sb] || false}
                onChange={event => this.toggleChange(sb, event.target.checked)}
              />
            }
          />
          <Collapse in={!!AdminConfig} timeout="auto" unmountOnExit>
            <CardContent>
              {AdminConfig && (
                <AdminConfig
                  settingsData={this.state}
                  onToggle={this.toggleChange}
                  setDefaultsOnMount={defaults => {
                    // collect default to setState on mount
                    Object.assign(this.collectedDefaults, defaults);
                  }}
                  organization={this.props.organization}
                />
              )}
            </CardContent>
          </Collapse>
        </Card>
      );
    });
    return (
      <div>
        <GSForm
          schema={yup.object(schemaObject)}
          value={this.state}
          onChange={this.onChange}
          onSubmit={this.props.onSubmit}
        >
          {adminItems}
          <Form.Submit
            as={GSSubmitButton}
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
