import type from "prop-types";
import React from "react";
import Form from "react-formal";
import { compose } from "recompose";
import * as yup from "yup";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";

import theme from "../../../styles/theme";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class CampaignContactsFormBase extends React.Component {
  constructor(props) {
    super(props);
    const { lastResult } = props;
    let cur = {};
    if (lastResult && lastResult.reference) {
      cur = JSON.parse(lastResult.reference);
    }
    console.log("s3-pull", lastResult, props);
    this.state = {
      s3Path: cur.s3Path || ""
    };
  }

  render() {
    const { lastResult, campaignIsStarted } = this.props;
    if (campaignIsStarted) {
      return <div>Path: {this.state.s3Path}</div>;
    }
    let results = {};
    if (lastResult && lastResult.result) {
      results = JSON.parse(lastResult.result);
      console.log("s3-pull results", results);
    }
    return (
      <div>
        {results.errors && results.errors.length && (
          <div>
            <h4 style={{ color: this.props.muiTheme.palette.error.main }}>
              Previous Errors
            </h4>
            <List>
              {results.errors.map(e => (
                <ListItem key={e.code || e}>
                  <ListItemIcon>{this.props.icons.error}</ListItemIcon>
                  <ListItemText
                    primary={e.message || e}
                    secondary={
                      e.code === "AccessDenied"
                        ? "Make sure the file exists and you are uploading to the correct S3 bucket"
                        : null
                    }
                  />
                </ListItem>
              ))}
            </List>
          </div>
        )}
        <GSForm
          schema={yup.object({
            s3Path: yup.string()
          })}
          defaultValue={this.state}
          onSubmit={formValues => {
            // sets values locally
            this.setState({ ...formValues });
            // and now do whatever happens when clicking 'Next'
            this.props.onSubmit();
          }}
          onChange={formValues => {
            console.log("onChange", formValues);
            this.setState(formValues);
            this.props.onChange(JSON.stringify(formValues));
          }}
        >
          <div>
            <div>
              Instead of uploading contacts, you can load them from an AWS S3
              Bucket path as long as Spoke has access to it. Paths should NOT
              include the S3 bucket and should start with a '/'.
              <p>
                You can load data from a Redshift instance with a command like
                this:
                <br />
                <code>
                  UNLOAD ('SELECT first_name, last_name, cell, zip FROM ...')
                  <br />
                  TO
                  's3://&lt;YOUR_S3_BUCKET>/&lt;some_path_for_this_campaign>/'
                  <br />
                  iam_role
                  'arn:aws:iam::&lt;AWS_ACCOUNT_ID>:role/&lt;AWS_ROLE_FOR_UNLOAD>'
                  <br />
                  manifest verbose gzip ESCAPE ALLOWOVERWRITE region
                  '&lt;REGION>'
                </code>
              </p>
            </div>
            <Form.Field as={GSTextField} name="s3Path" />
          </div>
          <Form.Submit
            as={GSSubmitButton}
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignContactsFormBase.prototype.renderAfterStart = true;

CampaignContactsFormBase.propTypes = {
  onChange: type.func,
  onSubmit: type.func,
  campaignIsStarted: type.bool,

  icons: type.object,

  saveDisabled: type.bool,
  saveLabel: type.string,

  lastResult: type.object,
  clientChoiceData: type.string,
  jobResultMessage: type.string
};

const CampaignContactsForm = compose(withMuiTheme)(CampaignContactsFormBase);

export { CampaignContactsForm };
