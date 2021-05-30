import type from "prop-types";
import React from "react";
import { compose } from "recompose";
import withMuiTheme from "./../containers/hoc/withMuiTheme";
import GSForm from "../components/forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";

import CheckIcon from "@material-ui/icons/Check";
import WarningIcon from "@material-ui/icons/Warning";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import Alert from "@material-ui/lab/Alert";

import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import components from "../extensions/contact-loaders/components";
import * as yup from "yup";
import { withRouter } from "react-router";

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  }
};

export class CampaignContactsChoiceForm extends React.Component {
  state = {
    uploading: false,
    validationStats: null,
    contactUploadError: null
  };

  getCurrentMethod() {
    const { ingestMethodChoices, pastIngestMethod, location } = this.props;
    if (typeof this.state.ingestMethodIndex === "number") {
      return ingestMethodChoices[this.state.ingestMethodIndex];
    }
    const name =
      (pastIngestMethod && pastIngestMethod.name) ||
      (location && location.query.contactLoader);
    if (name) {
      const index = ingestMethodChoices.findIndex(m => m.name === name);
      if (index) {
        // make sure it's available
        return ingestMethodChoices[index];
      }
    }

    return ingestMethodChoices[0];
  }

  ingestMethodChanged(index) {
    this.setState({ ingestMethodIndex: index });
  }

  handleChange(contactData) {
    this.props.onChange({
      contactData,
      ingestMethod: this.getCurrentMethod().name
    });
  }

  render() {
    const {
      maxNumbersPerCampaign,
      contactsPerPhoneNumber,
      ingestMethodChoices,
      pastIngestMethod,
      ensureComplete
    } = this.props;
    const ingestMethod = this.getCurrentMethod();
    const ingestMethodName = ingestMethod && ingestMethod.name;
    const lastResult =
      pastIngestMethod && pastIngestMethod.name === ingestMethodName
        ? pastIngestMethod
        : null;
    const IngestComponent = components[ingestMethodName];
    const { muiTheme } = this.props;

    const check = (
      <CheckIcon style={{ color: muiTheme.palette.success.main }} />
    );
    const warning = (
      <WarningIcon style={{ color: muiTheme.palette.warning.main }} />
    );
    const error = <ErrorIcon style={{ color: muiTheme.palette.error.main }} />;
    const info = <InfoIcon style={{ color: muiTheme.palette.info.main }} />;

    const icons = {
      check,
      warning,
      error,
      info
    };

    if (ensureComplete) {
      // isStarted
      return (
        <div>
          {this.props.contactsCount && (
            <div>
              <div>Ingest Method: {ingestMethod.displayName}</div>
              <div>Loaded Contacts: {this.props.contactsCount}</div>
              {lastResult ? (
                <div>
                  <div>Deleted Duplicates: {lastResult.deletedDupes}</div>
                  <div>Deleted OptOuts: {lastResult.deletedOptouts}</div>
                </div>
              ) : null}
            </div>
          )}
          {this.props.jobResultMessage && (
            <div>
              <CampaignFormSectionHeading title="Job Outcome" />
              <div>{this.props.jobResultMessage}</div>
            </div>
          )}

          {IngestComponent && IngestComponent.prototype.renderAfterStart ? (
            <IngestComponent
              onChange={chg => {
                this.handleChange(chg);
              }}
              onSubmit={this.props.onSubmit}
              campaignIsStarted={ensureComplete}
              icons={icons}
              saveDisabled={this.props.saveDisabled}
              saveLabel={this.props.saveLabel}
              clientChoiceData={ingestMethod && ingestMethod.clientChoiceData}
              lastResult={lastResult}
              jobResultMessage={null}
              contactsPerPhoneNumber={contactsPerPhoneNumber}
              maxNumbersPerCampaign={maxNumbersPerCampaign}
            />
          ) : null}
        </div>
      );
    }

    return (
      <div>
        <CampaignFormSectionHeading title="Who are you contacting?" />

        {contactsPerPhoneNumber && maxNumbersPerCampaign && (
          <Alert severity="info" style={{ marginBottom: 10 }}>
            <div>
              You can only upload a max of{" "}
              {Number(
                contactsPerPhoneNumber * maxNumbersPerCampaign
              ).toLocaleString()}{" "}
              contacts per campaign.
            </div>
            <div>
              Each campaign can be assigned {maxNumbersPerCampaign} numbers max
              with {contactsPerPhoneNumber} contacts per phone.
            </div>
          </Alert>
        )}

        <div>
          {!this.props.contactsCount ? null : (
            <div>
              <CampaignFormSectionHeading
                title={`Loaded Contacts: ${this.props.contactsCount}`}
              />
              <div>
                Submitting new contacts will replace the current loaded
                contacts.
              </div>
            </div>
          )}
          {!this.props.jobResultMessage ? null : (
            <div>
              <CampaignFormSectionHeading title="Job Outcome" />
              <div>{this.props.jobResultMessage}</div>
            </div>
          )}
          <GSForm
            schema={yup.object({
              ingestMethod: yup.string()
            })}
            onSubmit={formValues => {}}
          >
            <Select
              name={"ingestMethod"}
              value={ingestMethodName}
              label={"Contact Load Method"}
              onChange={event => {
                const index = ingestMethodChoices.findIndex(e => {
                  return e.name === event.target.value;
                });
                this.ingestMethodChanged(index);
              }}
            >
              {ingestMethodChoices.map(methodChoice => (
                <MenuItem key={methodChoice.name} value={methodChoice.name}>
                  {methodChoice.displayName}
                </MenuItem>
              ))}
            </Select>
          </GSForm>
          {IngestComponent && (
            <IngestComponent
              onChange={chg => {
                this.handleChange(chg);
              }}
              onSubmit={this.props.onSubmit}
              campaignIsStarted={ensureComplete}
              icons={icons}
              saveDisabled={this.props.saveDisabled}
              saveLabel={this.props.saveLabel}
              clientChoiceData={ingestMethod && ingestMethod.clientChoiceData}
              lastResult={lastResult}
              jobResultMessage={null}
              contactsPerPhoneNumber={contactsPerPhoneNumber}
              maxNumbersPerCampaign={maxNumbersPerCampaign}
            />
          )}
        </div>
      </div>
    );
  }
}
/*
         </GSForm>

*/
CampaignContactsChoiceForm.propTypes = {
  onChange: type.func.isRequired,
  formValues: type.object,
  ensureComplete: type.bool,
  onSubmit: type.func,
  location: type.object,
  saveDisabled: type.bool,
  saveLabel: type.string,
  jobResultMessage: type.string,
  ingestMethodChoices: type.array.isRequired,
  pastIngestMethod: type.object,
  contactsCount: type.number,
  maxNumbersPerCampaign: type.number,
  contactsPerPhoneNumber: type.number
};

export default compose(withMuiTheme, withRouter)(CampaignContactsChoiceForm);
