import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";
import cloneDeep from "lodash/cloneDeep";

const ACTION_HANDLERS = "ACTION_HANDLERS";
const MESSAGE_HANDLERS = "MESSAGE_HANDLERS";
const CONTACT_LOADERS = "CONTACT_LOADERS";

const integrationCategories = {
  actionHandlers: {
    schema: yup.string(),
    props: {
      name: ACTION_HANDLERS,
      handlers: "allowedActionHandlers" // TODO
    }
  },
  messageHandlers: {
    schema: yup.string(),
    props: {
      name: MESSAGE_HANDLERS,
      handlers: "allowedMessageHandlers" // TODO
    }
  },
  contactLoaders: {
    schema: yup.string(),
    props: {
      name: CONTACT_LOADERS,
      handlers: "allowedContactLoader" // TODO
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
          savedMesssageHandlers: formValues.savedMesssageHandlers,
          savedActionHandlers: formValues.savedActionHandlers,
          savedContactLoaders: formValues.savedContactLoaders
        }
      });
    });
  };

  toggled(integrationName, handlerName, isToggled) {
    const integrationType = this.getIntegrationType(integrationName);
    if (isToggled) {
      this.state[integrationType].push(handlerName);
    } else {
      this.state[integrationType] = this.state[integrationType].filter(
        h => h !== handlerName
      );
    }

    this.onChange({
      savedActionHandlers: this.state.savedActionHandlers,
      savedMessageHandlers: this.state.savedMesssageHandlers,
      savedContactLoaders: this.state.savedContactLoaders
    });
  }

  addToggleFormField(integrationName, handlerName) {
    const integrationType = this.getIntegrationType(integrationName);
    return (
      <Form.Field
        name={handlerName}
        type={Toggle}
        defaultToggled={this.props.formValues.extensionSettings[
          integrationType
        ].includes(handlerName)}
        label={handlerName}
        onToggle={async (_, isToggled) => {
          this.toggled(integrationName, handlerName, isToggled);
        }}
      />
    );
  }

  getIntegrationType(integrationName) {
    return integrationName === ACTION_HANDLER
      ? "savedActionHandlers"
      : integrationName === MESSAGE_HANDLER
      ? "savedMessageHandlers"
      : "savedContactLoaders";
  }

  render() {
    const schemaObject = {};
    const adminItems = Object.keys(integrationCategories).map(f => {
      schemaObject[f] = integrationCategories[f].schema;
      schemaObject[integrationCategories[f].props.name] = yup.string();
      const allowedCategoryHandlers = this.props.formValues.extensionSettings[
        integrationCategories[f].props.handlers
      ];
      return (
        allowedCategoryHandlers && (
          <div>
            <div>{integrationCategories[f].props.name}</div>
            {allowedCategoryHandlers.map((handlerName, index) => {
              schemaObject[allowedCategoryHandlers[index]] = yup.string();
              return this.addToggleFormField(
                integrationCategories[f].props.name,
                handlerName
              );
            })}
          </div>
        )
      );
    });
    console.log("schemaObject: ", schemaObject);
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
