import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";
import { dataSourceItem } from "./utils";

const toggled = (name, isToggled) => {
  const formValues = cloneDeep(this.props.formValues);
  formValues[name] = isToggled;
  this.props.onChange(formValues);
};

const IntegrationCategory = props => {
  return;
  <Form.Field
    label={props.label}
    name={props.name}
    type={Toggle}
    defaultToggled={true}
    onToggle={async (_, isToggled) => {
      this.toggled(name, isToggled);
    }}
  />;
};

const integrationCategories = {
  ACTION_HANDLERS: {
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      return (
        props.ACTION_HANDLERS && (
          <div>
            <div>Bob's Actions</div>
            {props.actionHandlers.map(ah => (
              <IntegrationCategory label={ah} name={ah} />
            ))}
          </div>
        )
      );
    }
  },
  MESSAGE_HANDLERS: {
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      return (
        <Form.Field
          label="Message Handlers (comma-separated)"
          name="MESSAGE_HANDLERS"
          fullWidth
          key={2}
        />
      );
    }
  },
  CONTACT_LOADERS: {
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      return (
        <Form.Field
          label="Contact Loaders"
          name="CONTACT_LOADERS"
          fullWidth
          key={3}
        />
      );
    }
  }
};

export default class ExtensionSettings extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData =
      (formValues.extensionSettings && formValues.extensionSettings) || {};
    this.state = { ...settingsData };
  }

  onChange = formValues => {
    console.log("onChange state", this.state);
    this.setState(formValues, () => {
      this.props.onChange({
        extensionSettings: {
          savedMesssageHandlers: JSON.stringify(this.state.MESSAGE_HANDLERS),
          savedActionHandlers: JSON.stringify(this.state.ACTION_HANDLERS),
          savedContactLoaders: JSON.stringify(this.state.CONTACT_LOADERS)
        }
      });
    });
  };

  render() {
    const schemaObject = {};
    const adminItems = Object.keys(integrationCategories).map(f => {
      schemaObject[f] = integrationCategories[f].schema;
      schemaObject[f] = integrationCategories[f].schema;
      return integrationCategories[f].component({
        ...this.props,
        parent: this
      });
    });
    console.log("currentstate: ", this.state);
    console.log("current props: ", this.props);
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
            {...dataTest("submitExtensionSettings")}
          />
        </GSForm>
      </div>
    );
  }
}

ExtensionSettings.propTypes = {
  formValues: type.object,
  organization: type.object,
  onChange: type.func,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
