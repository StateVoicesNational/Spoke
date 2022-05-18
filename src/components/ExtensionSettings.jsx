import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import * as yup from "yup";
import Form from "react-formal";
import { ToggleButton } from "@material-ui/lab";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";

const ACTION_HANDLERS = "ACTION_HANDLERS";
const MESSAGE_HANDLERS = "MESSAGE_HANDLERS";
const CONTACT_LOADERS = "CONTACT_LOADERS";

const integrationCategories = {
  actionHandlers: {
    schema: yup.string(),
    props: {
      name: "Action Handlers",
      handlers: "allowedActionHandlers"
    }
  },
  messageHandlers: {
    schema: yup.string(),
    props: {
      name: "Message Handlers",
      handlers: "allowedMessageHandlers"
    }
  },
  contactLoaders: {
    schema: yup.string(),
    props: {
      name: "Contact Loaders",
      handlers: "allowedContactLoaders"
    }
  }
};

export default class ExtensionSettings extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData = formValues.extensionSettings || {};
    const parsedHandlerDictionary = JSON.parse(
      settingsData.handlerDisplayInformation
    );
    this.state = {
      ...settingsData,
      handlerDisplayInformation: parsedHandlerDictionary
    };
    this.schemaObject = { actionWasNotDefined: yup.string() };
    this.adminItems = this.getAdminItems();
  }

  onChange = formValues => {
    this.setState(formValues, () => {
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

  addToggleFormField(integrationName, displayName, description) {
    const integrationType = this.getIntegrationType(integrationName);
    return (
      <div style={{ paddingLeft: "15px", paddingBottom: "5px" }}>
        <Form.Field
          name={"actionWasNotDefined"} // TODO we get this error when we use displayName, not sure why
          type={ToggleButton}
          defaultToggled={this.props.formValues.extensionSettings[
            integrationType
          ].includes(displayName)}
          label={displayName}
          onToggle={async (_, isToggled) => {
            this.toggled(integrationName, displayName, isToggled);
          }}
          key={displayName}
        />
        <div
          style={{ ...theme.text.body, fontSize: "10px", paddingLeft: "15px" }}
        >
          {description}
        </div>
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

  getDisplayInfo(handlerName) {
    const entry = this.state.handlerDisplayInformation[handlerName];
    if (!entry || entry.displayName === "") {
      console.warn(`no display info for handler: ${handlerName}`);
      const sanitizedHandlerName = handlerName.replace("-", " ");
      return { displayName: sanitizedHandlerName, description: "" };
    }
    return {
      displayName: entry.displayName,
      description: entry.description
    };
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
            {allowedCategoryHandlers.map(handlerName => {
              const displayInfo = this.getDisplayInfo(handlerName);
              const displayName = displayInfo.displayName;
              const description = displayInfo.description;
              this.schemaObject[displayName] = yup.string();
              this.schemaObject[description] = yup.string();
              return this.addToggleFormField(
                integrationCategories[f].props.name,
                displayName,
                description
              );
            })}
          </div>
        )
      );
    });
  };

  render() {
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
