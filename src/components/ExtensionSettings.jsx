import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";
import cloneDeep from "lodash/cloneDeep";
import theme from "../styles/theme";

const ACTION_HANDLERS = "ACTION_HANDLERS";
const MESSAGE_HANDLERS = "MESSAGE_HANDLERS";
const CONTACT_LOADERS = "CONTACT_LOADERS";

const integrationCategories = {
  actionHandlers: {
    schema: yup.string(),
    props: {
      name: ACTION_HANDLERS,
      handlers: "allowedActionHandlers"
    }
  },
  messageHandlers: {
    schema: yup.string(),
    props: {
      name: MESSAGE_HANDLERS,
      handlers: "allowedMessageHandlers"
    }
  },
  contactLoaders: {
    schema: yup.string(),
    props: {
      name: CONTACT_LOADERS,
      handlers: "allowedContactLoaders"
    }
  }
};

export default class ExtensionSettings extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData = formValues.extensionSettings || {};
    this.state = { ...settingsData };
    this.schemaObject = { actionWasNotDefined: yup.string() };
    this.adminItems = this.getAdminItems();
  }

  onChange = formValues => {
    this.setState(formValues, () => {
      console.log("boop", formValues);
      this.props.onChange({
        extensionSettings: {
          savedMessageHandlers: formValues.savedMessageHandlers,
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
      savedMessageHandlers: this.state.savedMessageHandlers,
      savedContactLoaders: this.state.savedContactLoaders
    });
  }

  addToggleFormField(integrationName, handlerName) {
    const integrationType = this.getIntegrationType(integrationName);
    return (
      <div style={{ paddingLeft: "15px" }}>
        <Form.Field
          name={"actionWasNotDefined"} // TODO we get this error when we use handlerName, not sure why
          type={Toggle}
          defaultToggled={this.props.formValues.extensionSettings[
            integrationType
          ].includes(handlerName)}
          label={handlerName}
          onToggle={async (_, isToggled) => {
            this.toggled(integrationName, handlerName, isToggled);
          }}
          key={handlerName}
        />
      </div>
    );
  }

  getIntegrationType(integrationName) {
    return integrationName === ACTION_HANDLERS
      ? "savedActionHandlers"
      : integrationName === MESSAGE_HANDLERS
      ? "savedMessageHandlers"
      : "savedContactLoaders";
  }

  getAdminItems = () => {
    return Object.keys(integrationCategories).map(f => {
      this.schemaObject[f] = integrationCategories[f].schema;
      this.schemaObject[integrationCategories[f].props.name] = yup.string();
      const allowedCategoryHandlers = this.props.formValues.extensionSettings[
        integrationCategories[f].props.handlers
      ];
      return (
        allowedCategoryHandlers.length > 0 && (
          <div key={f} style={{ marginBottom: "10px" }}>
            <div
              style={{ ...theme.text.secondaryHeader, marginBottom: "10px" }}
            >
              {integrationCategories[f].props.name}
            </div>
            {allowedCategoryHandlers.map((handlerName, index) => {
              this.schemaObject[handlerName] = yup.string();
              return this.addToggleFormField(
                integrationCategories[f].props.name,
                handlerName
              );
            })}
          </div>
        )
      );
    });
  };

  render() {
    console.log("currentstate: ", this.state);
    console.log("current props: ", this.props.formValues.extensionSettings);
    return (
      <div>
        <GSForm
          schema={yup.object(this.schemaObject)}
          value={this.state}
          onChange={this.onChange}
        >
          {this.adminItems}
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
