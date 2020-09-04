import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";

const configurableFields = {
  ACTION_HANDLERS: {
    category: 'defaults',
    ready: false, // TODO: let's wait for better interface
    schema: ({ formValues }) =>
      formValues.settings.actionHandlers
        ? yup
            .string()
            .test(
              "comma-separated-handlers",
              "Must be a comma-separated list without spaces of action handlers.",
              value => {
                if (!value) {
                  return true;
                }
                const handlers = value.split(",");
                for (let i = 0; i < handlers.length; i++) {
                  if (
                    formValues.settings.actionHandlers.indexOf(handlers[i]) ===
                    -1
                  ) {
                    return false;
                  }
                }
                return true;
              }
            )
        : yup.string(),
    component: props => {
      // maybe show the list and then validate
      return (
        <div>
          <Form.Field
            label="Action Handlers (comma-separated)"
            name="ACTION_HANDLERS"
            fullWidth
          />
          <div style={{ padding: "8px" }}>
            This should be a comma-separated list without spaces of the
            available handlers.
            <br />
            Available handlers:
            {props.formValues.settings.actionHandlers.map(h => (
              <code> {h}</code>
            ))}
          </div>
        </div>
      );
    }
  },
  ALLOW_SEND_ALL_ENABLED: {
    category: 'defaults',
    schema: () => yup.boolean(),
    ready: true,
    component: props => {
      if (!window.ALLOW_SEND_ALL) {
        return null;
      }
      return (
        <div>
          <Toggle
            toggled={props.parent.state.ALLOW_SEND_ALL_ENABLED}
            label="Allow 'Send All' single-button"
            onToggle={(toggler, val) =>
              props.parent.toggleChange("ALLOW_SEND_ALL_ENABLED", val)
            }
          />
          {props.parent.state.ALLOW_SEND_ALL_ENABLED ? (
            <div style={{ padding: "8px" }}>
              <p>
                You are turning on ALLOW_SEND_ALL mode, which means Spoke will
                be substantially altered from its default configuration.
              </p>
              <p>
                <b>
                  PLEASE CONSULT WITH LEGAL COUNSEL BEFORE YOU ALTER THIS
                  VARIABLE TO ENSURE THAT YOUR USE OF SPOKE IS COMPLIANT WITH
                  APPLICABLE LAW IN YOUR JURISDICTION FOR PERSON-TO-PERSON
                  TEXTING.
                </b>
              </p>
            </div>
          ) : (
            <div style={{ padding: "8px" }}>
              Please consult with legal counsel before you enable this.
            </div>
          )}
        </div>
      );
    }
  },
  DEFAULT_BATCHSIZE: {
    category: 'defaults',
    schema: () =>
      yup
        .number()
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div>
          <Form.Field
            label="Default Batch Size"
            name="DEFAULT_BATCHSIZE"
            fullWidth
          />
          <div style={{ padding: "8px" }}>
            For Dynamic Assignment, what should the default batch size be before
            texters should start replying? (will be 300 if left blank)
          </div>
        </div>
      );
    }
  },
  DEFAULT_RESPONSEWINDOW: {
    category: 'defaults',
    schema: () => yup.number().notRequired(),
    ready: true,
    component: props => {
      return (
        <div>
          <Form.Field
            label="Default Response Window"
            name="DEFAULT_RESPONSEWINDOW"
            fullWidth
          />
          <div style={{ padding: "8px" }}>
            For Dynamic Assignment, what period in hours before contacts might
            be reassigned without a response from the texter? This is used for
            Message Review querying with the "Expired Needs Response" message
            status filter, nothing automated.
          </div>
        </div>
      );
    }
  },
  MAX_CONTACTS_PER_TEXTER: {
    category: 'defaults',
    schema: () =>
      yup
        .number()
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div>
          <Form.Field
            label="Maximum Number of Contacts per-texter"
            name="MAX_CONTACTS_PER_TEXTER"
            fullWidth
          />
          <div style={{ padding: "8px" }}>
            What is the maximum number of contacts a texter can be dynamically
            assigned on a particular campaign? (set to blank for no maximum)
            <p>
              This can be overridden on particular by assigning a different max
              contacts in the Texters campaign panel. If you set this to match
              your batch size then implicitly there will be a manual step to
              give texters another batch.
            </p>
          </div>
        </div>
      );
    }
  },
  MAX_MESSAGE_LENGTH: {
    category: 'defaults',
    schema: () =>
      yup
        .number()
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div>
          <Form.Field
            label="Max Message Length"
            name="MAX_MESSAGE_LENGTH"
            fullWidth
          />
          <div style={{ padding: "8px" }}>
            Maximum message length texters can send (blank means no maximum)
          </div>
        </div>
      );
    }
  }
};

export default class OrganizationFeatureSettings extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData =
      (formValues.settings.featuresJSON &&
        JSON.parse(formValues.settings.featuresJSON)) ||
      {};
    this.state = { ...settingsData, unsetFeatures: [] };
  }

  onChange = formValues => {
    const newData = {
      ...formValues,
      unsetFeatures: Object.keys(formValues).filter(f => formValues[f] === "")
    }
    console.log("onChange", newData);
    this.setState(newData, () => {
      this.props.onChange({
        settings: {
          [this.props.category]: {
            featuresJSON: JSON.stringify(this.state),
            unsetFeatures: this.state.unsetFeatures
          }
        }
      });
    });
  };

  toggleChange = (key, value) => {
    console.log("toggleChange", key, value);
    this.setState({ [key]: value }, newData => {
      this.props.onChange({
        settings: {
          featuresJSON: JSON.stringify(this.state),
          unsetFeatures: this.state.unsetFeatures
        }
      });
    });
  };

  saveDisabled = () => {
    if (this.props.saveDisabled !== undefined) {
      return this.props.saveDisabled;
    }
    return !this.props.parentState
      || !this.props.parentState[this.props.category]
  };

  render() {
    const schemaObject = {};
    const adminItems = Object.keys(configurableFields)
      .filter(f => configurableFields[f].ready
        && configurableFields[f].category === this.props.category
        && this.state.hasOwnProperty(f))
      .map(f => {
        schemaObject[f] = configurableFields[f].schema({
          ...this.props,
          ...this.state
        });
        return configurableFields[f].component({ ...this.props, parent: this });
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
            disabled={this.saveDisabled()}
            {...dataTest("submitOrganizationFeatureSettings")}
          />
        </GSForm>
      </div>
    );
  }
}

OrganizationFeatureSettings.propTypes = {
  formValues: type.object,
  category: type.string,
  parentState: type.object,
  organization: type.object,
  onChange: type.func,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
