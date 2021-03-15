import type from "prop-types";
import React from "react";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import GSTextField from "../../../components/forms/GSTextField";

import Form from "react-formal";
import { ListItem, List } from "material-ui/List";
import * as yup from "yup";

export class CampaignContactsForm extends React.Component {
  state = {
    errorResult: null
  };

  render() {
    const { clientChoiceData, lastResult } = this.props;
    let resultMessage = "";
    if (lastResult && lastResult.result) {
      const { message, finalCount } = JSON.parse(lastResult.result);
      resultMessage = message
        ? message
        : `Final count was ${finalCount} when you chose ${lastResult.reference}`;
    }
    return (
      <GSForm
        schema={yup.object({
          requestContactCount: yup.number().integer()
        })}
        onChange={formValues => {
          this.setState({ ...formValues });
          this.props.onChange(JSON.stringify(formValues));
        }}
        onSubmit={formValues => {
          // sets values locally
          this.setState({ ...formValues });
          // triggers the parent to update values
          this.props.onChange(JSON.stringify(formValues));
          // and now do whatever happens when clicking 'Next'
          this.props.onSubmit();
        }}
      >
        <Form.Field
          as={GSTextField}
          fullWidth
          name="requestContactCount"
          type="number"
          label="How many fake contacts"
        />
        <List>
          <ListItem
            primaryText={clientChoiceData}
            leftIcon={this.props.icons.check}
          />
          {resultMessage ? (
            <ListItem
              primaryText={resultMessage}
              leftIcon={this.props.icons.warning}
            />
          ) : null}
        </List>

        <Form.Submit
          as={GSSubmitButton}
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
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
