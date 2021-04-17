import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import GSTextField from "../../../components/forms/GSTextField";
import Form from "react-formal";
import Subheader from "material-ui/Subheader";
import Divider from "@material-ui/core/Divider";
import { ListItem, List } from "material-ui/List";
import CampaignFormSectionHeading from "../../../components/CampaignFormSectionHeading";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import { StyleSheet, css } from "aphrodite";
import * as yup from "yup";
import { withRouter, Link } from "react-router";

export class CampaignContactsFormInner extends React.Component {
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
    console.log("pastcontacts", lastResult, props);
    this.state = {
      pastContactsQuery:
        props.location.query.pastContactsQuery || cur.pastContactsQuery || "",
      questionResponseAnswer:
        props.location.query.questionResponseAnswer ||
        cur.questionResponseAnswer ||
        ""
    };
  }

  render() {
    const {
      campaignIsStarted,
      clientChoiceData,
      lastResult,
      location
    } = this.props;
    if (campaignIsStarted) {
      const messageReviewLink = location.pathname.replace(
        /campaigns.*/,
        "incoming"
      );
      return (
        <div>
          Loaded query:{" "}
          <Link to={`${messageReviewLink}?${this.state.pastContactsQuery}`}>
            {this.state.pastContactsQuery}
          </Link>
          {this.state.questionResponseAnswer ? (
            <div>
              Question Response Answer: {this.state.questionResponseAnswer}
            </div>
          ) : null}
        </div>
      );
    }
    let resultMessage = "";
    return (
      <GSForm
        schema={yup.object({
          pastContactsQuery: yup.string().required(),
          questionResponseAnswer: yup.string()
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
          Copy the url or the query string from a Message Review filter. Note
          that if you load contacts across campaigns, the custom fields will be
          reduced to those that all contacts have in common.
        </p>
        <Form.Field
          as={GSTextField}
          name="pastContactsQuery"
          label="Message Review URL"
          fullWidth
        />
        <p>
          You can narrow the result further with the exact text of the{" "}
          <b>Answer</b> for a question response
        </p>
        <Form.Field
          as={GSTextField}
          name="questionResponseAnswer"
          label="Question Response Answer"
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

CampaignContactsFormInner.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  clientChoiceData: type.string,
  jobResultMessage: type.string,
  lastResult: type.object,
  location: type.object
};

export const CampaignContactsForm = withRouter(CampaignContactsFormInner);

CampaignContactsForm.prototype.renderAfterStart = true;
