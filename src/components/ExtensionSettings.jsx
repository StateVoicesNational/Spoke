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

const toggled = (name, isToggled) => {
  const formValues = cloneDeep(this.props.formValues);
  formValues[name] = isToggled;
  this.props.onChange(formValues);
};

/*
export default class Integration = (props) => {
  return  
    <Form.Field
      label={props.label}
      name={props.name}
      type={Toggle}
      defaultToggled={true}
      onToggle={async (_, isToggled) => {
        this.toggled(name, isToggled);
      }}
    />
}
*/

const integrationCategories = {
  ACTION_HANDLERS: {
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      /* 
      return (
        {props.actionHandlers && (
          <div>Bob's Actions</>
          {props.actionHandlers.map(ah => (
            <Integration>
              label = ah
              name = ah
              description = "ready set action handler"
              fullWidth
            </>
            )
          )}
        }
      )
      */
      return (
        <Form.Field label="Action Handlers" name="ACTION_HANDLERS" fullWidth />
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
        />
      );
    }
  },
  CONTACT_LOADERS: {
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      return (
        <Form.Field label="Contact Loaders" name="CONTACT_LOADERS" fullWidth />
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
    console.log("onChange state", this.state);
    this.setState(formValues, () => {
      this.props.onChange({
        settings: {
          featuresJSON: JSON.stringify(this.state),
          unsetFeatures: this.state.unsetFeatures
        }
      });
    });
  };

  render() {
    // message handlers add/remove
    // action handlers: add/remove
    // features and unsetFeatures list
    const schemaObject = {};
    const adminItems = Object.keys(integrationCategories).map(f => {
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

OrganizationFeatureSettings.propTypes = {
  formValues: type.object,
  organization: type.object,
  onChange: type.func,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool
};
