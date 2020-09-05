import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../../../components/forms/GSForm";
import Form from "react-formal";
import Subheader from "material-ui/Subheader";
import { ListItem, List } from "material-ui/List";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import CampaignFormSectionHeading from "../../../components/CampaignFormSectionHeading";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import AutoComplete from "material-ui/AutoComplete";
import FontIcon from "material-ui/FontIcon";
import ActionFlightTakeoff from "material-ui/svg-icons/action/flight-takeoff";

import LoadingIndicator from "../../../components/LoadingIndicator";

export class CampaignContactsForm extends React.Component {
  state = {
    errorResult: null,
    list: null,
    result: [],
    loading: false
  };

  refreshList(query) {
    if (query.length < 3) {
      this.setState({ result: [] });
      return;
    }

    this.setState({ loading: true });
    fetch("/integration/civicrm/groupsearch?query=" + query)
      .then(res => res.json())
      .then(res => this.setState({ result: res, loading: false }));
  }

  render() {
    const { clientChoiceData, lastResult } = this.props,
      props = this.props;
    let resultMessage = "";
    if (lastResult && lastResult.result) {
      const { message, finalCount } = JSON.parse(lastResult.result);
      resultMessage = message ? message : `Loaded ${finalCount} contacts`;
    }

    return (
      <GSForm
        schema={yup.object({
          groupId: yup.string().required()
        })}
        onChange={formValues => {
          this.setState({ ...formValues });
          props.onChange(JSON.stringify(formValues));
        }}
        onSubmit={formValues => {
          // sets values locally
          this.setState({ ...formValues });
          // triggers the parent to update values
          props.onChange(JSON.stringify(formValues));
          // and now do whatever happens when clicking 'Next'
          props.onSubmit();
        }}
      >
        <Form.Field
          name="groupId"
          as="select"
          type={AutoComplete}
          fullWidth
          filter={AutoComplete.noFilter}
          dataSource={this.state.result}
          onNewRequest={function(el) {
            this.onChange(el.id);
          }}
          dataSourceConfig={{
            text: "title",
            value: "id"
          }}
          hintText="Choose CiviCRM list"
          onUpdateInput={this.refreshList.bind(this)}
        />
        {this.state.loading && <LoadingIndicator />}

        <List>
          {resultMessage ? (
            <ListItem
              primaryText={resultMessage}
              leftIcon={props.icons.warning}
            />
          ) : null}
        </List>

        <Form.Button
          type="submit"
          disabled={props.saveDisabled}
          label={props.saveLabel}
        />
      </GSForm>
    );
  }
}

CampaignContactsForm.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  clientChoiceData: type.string,
  jobResultMessage: type.string,
  lastResult: type.object
};
