import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import { ListItem, List } from "material-ui/List";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import InfoIcon from "material-ui/svg-icons/action/info";
import theme from "../styles/theme";
import components from "../integrations/contact-loaders/components";
import yup from "yup";

const check = <CheckIcon color={theme.colors.green} />;
const warning = <WarningIcon color={theme.colors.orange} />;
const error = <ErrorIcon color={theme.colors.red} />;
const info = <InfoIcon color={theme.colors.green} />;

export const icons = {
  check,
  warning,
  error,
  info
};

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  }
};

export default class CampaignContactsChoiceForm extends React.Component {
  state = {
    uploading: false,
    validationStats: null,
    contactUploadError: null
  };

  getCurrentMethod() {
    const { ingestMethodChoices, pastIngestMethod } = this.props;
    if (typeof this.state.ingestMethodIndex === "number") {
      return ingestMethodChoices[this.state.ingestMethodIndex];
    } else if (pastIngestMethod && pastIngestMethod.name) {
      const index = ingestMethodChoices.findIndex(
        m => m.name === pastIngestMethod.name
      );
      if (index) {
        // make sure it's available
        return ingestMethodChoices[index];
      }
    }
    return ingestMethodChoices[0];
  }

  ingestMethodChanged(event, index, val) {
    this.setState({ ingestMethodIndex: index });
  }

  handleChange(contactData) {
    this.props.onChange({
      contactData: contactData,
      ingestMethod: this.getCurrentMethod().name
    });
  }

  render() {
    const { ingestMethodChoices, pastIngestMethod } = this.props;
    const ingestMethod = this.getCurrentMethod();
    const ingestMethodName = ingestMethod && ingestMethod.name;
    const lastResult =
      pastIngestMethod && pastIngestMethod.name === ingestMethodName
        ? pastIngestMethod
        : null;
    const IngestComponent = components[ingestMethodName];
    return (
      <div>
        <CampaignFormSectionHeading title="Who are you contacting?" />
        <div>
          {!this.props.contactsCount ? (
            ""
          ) : (
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
          {!this.props.jobResultMessage ? (
            ""
          ) : (
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
            <SelectField
              name={"ingestMethod"}
              value={ingestMethodName}
              floatingLabelText={"Contact Load Method"}
              floatingLabelFixed
              onChange={(e, index, val) =>
                this.ingestMethodChanged(e, index, val)
              }
            >
              {ingestMethodChoices.map(methodChoice => (
                <MenuItem
                  key={methodChoice.name}
                  value={methodChoice.name}
                  primaryText={methodChoice.displayName}
                  checked={
                    ingestMethod && ingestMethod.name === methodChoice.name
                  }
                />
              ))}
            </SelectField>
          </GSForm>
          {IngestComponent && (
            <IngestComponent
              onChange={chg => {
                this.handleChange(chg);
              }}
              onSubmit={this.props.onSubmit}
              campaignIsStarted={this.props.ensureComplete}
              icons={icons}
              saveDisabled={this.props.saveDisabled}
              saveLabel={this.props.saveLabel}
              clientChoiceData={ingestMethod && ingestMethod.clientChoiceData}
              lastResult={lastResult}
              jobResultMessage={null}
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
  saveDisabled: type.bool,
  saveLabel: type.string,
  jobResultMessage: type.string,
  ingestMethodChoices: type.array.isRequired,
  pastIngestMethod: type.object,
  contactsCount: type.number
};
