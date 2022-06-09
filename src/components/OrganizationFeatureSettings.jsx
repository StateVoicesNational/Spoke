import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import * as yup from "yup";
import Form from "react-formal";
import { dataTest } from "../lib/attributes";
import GSTextField from "./forms/GSTextField";
import GSSubmitButton from "./forms/GSSubmitButton";
import Card from "@material-ui/core/Card";
// import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

const configurableFields = {
  ALLOW_SEND_ALL_ENABLED: {
    schema: () => yup.boolean(),
    ready: true,
    component: props => {
      if (typeof window === "undefined" || !window.ALLOW_SEND_ALL) {
        return null;
      }
      return (
        <div key={props.key}>
          <FormControlLabel
            control={
              <Switch
                checked={props.parent.state.ALLOW_SEND_ALL_ENABLED}
                onChange={event =>
                  props.parent.toggleChange(
                    "ALLOW_SEND_ALL_ENABLED",
                    event.target.checked
                  )
                }
                color="primary"
              />
            }
            label="Allow 'Send All' single-button"
            labelPlacement="start"
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
    schema: () =>
      yup
        .number()
        .transform(cv => (isNaN(cv) ? undefined : cv))
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div key={props.key}>
          <Form.Field
            as={GSTextField}
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
    schema: () =>
      yup
        .number()
        .transform(cv => (isNaN(cv) ? undefined : cv))
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div key={props.key}>
          <Form.Field
            as={GSTextField}
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
    schema: () =>
      yup
        .number()
        .transform(cv => (isNaN(cv) ? undefined : cv))
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div key={props.key}>
          <Form.Field
            as={GSTextField}
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
    schema: () =>
      yup
        .number()
        .transform(cv => (isNaN(cv) ? undefined : cv))
        .integer()
        .notRequired(),
    ready: true,
    component: props => {
      return (
        <div key={props.key}>
          <Form.Field
            as={GSTextField}
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

/**
 * remove the key if we don't need it so yup will validate
 * corectly and submit the form.
 */
if (typeof window === "undefined" || !window.ALLOW_SEND_ALL) {
  delete configurableFields.ALLOW_SEND_ALL_ENABLED;
}

export default class OrganizationFeatureSettings extends React.Component {
  constructor(props) {
    super(props);
    const { formValues } = this.props;
    const settingsData =
      (formValues.defaultSettings.featuresJSON &&
        JSON.parse(formValues.defaultSettings.featuresJSON)) ||
      {};
    this.state = { ...settingsData, unsetFeatures: [] };
    // expects a boolean
    this.state.ALLOW_SEND_ALL_ENABLED = !!this.state.ALLOW_SEND_ALL_ENABLED;
  }

  onChange = formValues => {
    this.setState(formValues, () => {
      this.props.onChange({
        defaultSettings: {
          featuresJSON: JSON.stringify(this.state),
          unsetFeatures: this.state.unsetFeatures
        }
      });
    });
  };

  toggleChange = (key, value) => {
    // console.log("toggleChange", key, value);
    this.setState({ [key]: value }, newData => {
      this.props.onChange({
        defaultSettings: {
          featuresJSON: JSON.stringify(this.state),
          unsetFeatures: this.state.unsetFeatures
        }
      });
    });
  };

  render() {
    const schemaObject = {};
    const adminItems = Object.keys(configurableFields)
      .filter(f => configurableFields[f].ready && this.state.hasOwnProperty(f))
      .map(f => {
        schemaObject[f] = configurableFields[f].schema({
          ...this.props,
          ...this.state
        });
        return configurableFields[f].component({
          key: f,
          ...this.props,
          parent: this
        });
      });
    //
    // console.log("CONFIGURABLE FIELDS!!!=================", configurableFields)

    return (
      <div>
        <Card>
          <CardHeader />
          <GSForm
            schema={yup.object(schemaObject)}
            value={this.state}
            onChange={this.onChange}
            onSubmit={this.props.onSubmit}
          >
            {adminItems}
            <Form.Submit
              as={GSSubmitButton}
              key="OFS-submit"
              label={this.props.saveLabel}
              disabled={this.props.saveDisabled}
              // {...dataTest("submitOrganizationFeatureSettings")}
            />
          </GSForm>
        </Card>
      </div>
    );
  }
}

OrganizationFeatureSettings.propTypes = {
  formValues: type.object,
  organization: type.object,
  onChange: type.func,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
