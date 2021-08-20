import type from "prop-types";
import React from "react";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import GSTextField from "../../../components/forms/GSTextField";
import Form from "react-formal";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

import * as yup from "yup";

export class CampaignContactsForm extends React.Component {
  constructor(props) {
    super(props);
    const { lastResult } = props;
    let cur = {};
    if (lastResult && lastResult.reference) {
      try {
        cur = JSON.parse(lastResult.reference);
      } catch (err) {
        // parse error should just stay empty
      }
    }
    console.log("redash", lastResult, props);
    this.state = {
      redashUrl: cur.redashUrl || ""
    };
  }

  render() {
    const { campaignIsStarted, clientChoiceData, lastResult } = this.props;
    if (campaignIsStarted) {
      return (
        <div>
          Loaded query:{" "}
          <a href={`${this.state.redashUrl}`} target="_blank">
            {this.state.redashUrl}
          </a>
        </div>
      );
    }
    let errorMessage = "";
    if (lastResult && lastResult.result) {
      const resultInfo = JSON.parse(lastResult.result);
      console.log(resultInfo);
      if (resultInfo && resultInfo.errors) {
        errorMessage = resultInfo.errors[0];
      }
    }
    return (
      <GSForm
        schema={yup.object({
          redashUrl: yup.string().required()
        })}
        value={this.state}
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
        <p>
          Provide a redash url that should look something like{" "}
          <code>https:{"//"}&lt;RedashServer>/queries/&lt;digits></code> or{" "}
          <code>
            https:{"//"}&lt;RedashServer>/queries/&lt;digits>?p_someparam=123
          </code>{" "}
          -- make sure the parameters are not just the defaults but the ones you
          want set for your query.
        </p>
        <Form.Field
          as={GSTextField}
          name="redashUrl"
          label="Redash URL (w/params if needed)"
          fullWidth
        />
        <List>
          {errorMessage && (
            <ListItem>
              <ListItemIcon>{this.props.icons.warning}</ListItemIcon>
              <ListItemText primary={errorMessage} />
            </ListItem>
          )}
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

CampaignContactsForm.prototype.renderAfterStart = true;
