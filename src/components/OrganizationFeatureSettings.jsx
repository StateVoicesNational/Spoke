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

const configurableFields = {
  ACTION_HANDLERS: {
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
                be substantially altered from its code for the use of
                person-to-person texting in the United States.
              </p>
              <p>
                <b>
                  PLEASE CONSULT WITH LEGAL COUNSEL BEFORE YOU ALTER THIS
                  VARIABLE.
                </b>
              </p>
              <p>
                If you wish to continue, you attest that you are using Spoke
                non-compliantly for US person-to-person texting. In this mode,
                you may{" "}
                <b>
                  <em>only</em>
                </b>
                text individuals that have given you express consent to do so.
                Neither Spoke, nor its creators, may be held liable for your use
                of the software in a non-compliant manner.
              </p>
            </div>
          ) : (
            <div style={{ padding: "8px" }}>
              Non-US compliant for unsubscribed contacts
            </div>
          )}
        </div>
      );
    }
  },
  DEFAULT_BATCHSIZE: {
    schema: () => yup.number().integer(),
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
  MAX_CONTACTS_PER_TEXTER: {
    schema: () => yup.number().integer(),
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
    schema: () => yup.number().integer(),
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
    console.log("onChange", formValues);
    this.setState(formValues, () => {
      this.props.onChange({
        settings: {
          featuresJSON: JSON.stringify(this.state),
          unsetFeatures: this.state.unsetFeatures
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

  render() {
    const schemaObject = {};
    const adminItems = Object.keys(configurableFields)
      .filter(f => configurableFields[f].ready && this.state.hasOwnProperty(f))
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
            disabled={this.props.saveDisabled}
            {...dataTest("submitOrganizationFeatureSettings")}
          />
        </GSForm>
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
