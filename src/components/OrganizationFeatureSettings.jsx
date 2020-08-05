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
    schema: yup.string(),
    component: props => {
      // toggles on/off for each handler, needs a description of each
      return <div></div>;
    }
  },
  ALLOW_SEND_ALL_ENABLED: {
    schema: yup.boolean(),
    component: props => {
      // toggle ? with important legal text!!
      return <div></div>;
    }
  },
  DEFAULT_BATCHSIZE: {
    schema: yup.number().integer(),
    component: props => {
      return <div></div>;
    }
  },
  MAX_CONTACTS_PER_TEXTER: {
    schema: yup.number().integer(),
    component: props => {
      // allow empty (set empty for null)
      return <div></div>;
    }
  },
  MAX_MESSAGE_LENGTH: {
    schema: yup.number().integer(),
    component: props => {
      return <div></div>;
    }
  },
  MESSAGE_HANDLERS: {
    schema: yup.string(),
    component: props => {
      return <div></div>;
    }
  },
  opt_out_message: {
    schema: yup.string(),
    component: props => {
      // default to props.organization.optOutMessage
      return <div></div>;
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
    // message handlers add/remove
    // action handlers: add/remove
    // features and unsetFeatures list
    console.log(
      "OrganizationFeatureSettings",
      this.state,
      this.props.formValues
    );
    const adminItems = [];
    const schemaObject = {};
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
