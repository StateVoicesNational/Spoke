import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import moment from "moment";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import GSForm from "./forms/GSForm";
import GSTextField from "./forms/GSTextField";
import GSDateField from "./forms/GSDateField";
import GSSubmitButton from "./forms/GSSubmitButton";
import * as yup from "yup";
import Toggle from "material-ui/Toggle";
import ColorPicker from "material-ui-color-picker";
import { dataTest } from "../lib/attributes";
import RaisedButton from "material-ui/RaisedButton";

const FormSchema = {
  title: yup.string(),
  description: yup.string(),
  dueBy: yup.mixed(),
  logoImageUrl: yup
    .string()
    .url()
    .transform(value => (!value ? null : value))
    .nullable(),
  primaryColor: yup.string().nullable(),
  introHtml: yup.string().nullable()
};

const EnsureCompletedFormSchema = {
  title: yup.string().required(),
  description: yup.string().required(),
  dueBy: yup.mixed().required(),
  logoImageUrl: yup
    .string()
    .transform(value => (!value ? null : value))
    .url()
    .nullable(),
  primaryColor: yup
    .string()
    .transform(value => (!value ? null : value))
    .nullable(),
  introHtml: yup
    .string()
    .transform(value => (!value ? null : value))
    .nullable()
};

export default class CampaignBasicsForm extends React.Component {
  formValues() {
    return {
      ...this.props.formValues,
      dueBy: this.props.formValues.dueBy
    };
  }

  formSchema() {
    if (!this.props.ensureComplete) {
      return yup.object(FormSchema);
    }
    return yup.object(EnsureCompletedFormSchema);
  }

  render() {
    return (
      <div>
        <CampaignFormSectionHeading title="What's your campaign about?" />
        <GSForm
          schema={this.formSchema()}
          value={this.formValues()}
          onChange={this.props.onChange}
          onSubmit={this.props.onSubmit}
          {...dataTest("campaignBasicsForm")}
        >
          <Form.Field
            as={GSTextField}
            {...dataTest("title")}
            name="title"
            label="Title (required)"
            hintText="e.g. Election Day 2016"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            {...dataTest("description")}
            name="description"
            label="Description (required)"
            hintText="Get out the vote"
            fullWidth
          />
          <Form.Field
            as={props => <GSDateField utcOffset={0} fullWidth {...props} />}
            {...dataTest("dueBy")}
            name="dueBy"
            label="Due date (required)"
            locale="en-US"
            shouldDisableDate={date => moment(date).diff(moment()) < 0}
            autoOk
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            name="introHtml"
            label="Intro HTML"
            multiLine
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            name="logoImageUrl"
            label="Logo Image URL"
            hintText="https://www.mysite.com/images/logo.png"
            fullWidth
          />
          <label>Primary color</label>
          <Form.Field
            name="primaryColor"
            label="Primary color"
            defaultValue={this.props.formValues.primaryColor || "#ffffff"}
            as={ColorPicker}
          />
          <Form.Submit
            as={GSSubmitButton}
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignBasicsForm.propTypes = {
  formValues: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    dueBy: PropTypes.any,
    logoImageUrl: PropTypes.string,
    primaryColor: PropTypes.string,
    introHtml: PropTypes.string
  }),
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  saveLabel: PropTypes.string,
  saveDisabled: PropTypes.bool,
  ensureComplete: PropTypes.bool
};
