import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import moment from "moment";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import GSForm from "./forms/GSForm";
import GSColorPicker from "./forms/GSColorPicker";
import GSTextField from "./forms/GSTextField";
import GSDateField from "./forms/GSDateField";
import GSSubmitButton from "./forms/GSSubmitButton";
import * as yup from "yup";
import { dataTest } from "../lib/attributes";

const FormSchemaBeforeStarted = {
  title: yup.string().required(),
  description: yup.string().required(),
  dueBy: yup
    .mixed()
    .required()
    .test(
      "in-future",
      "Due date should be in the future: when you expect the campaign to end",
      val => val > new Date()
    ),
  logoImageUrl: yup
    .string()
    .url()
    .transform(value => (!value ? null : value))
    .nullable(),
  primaryColor: yup.string().nullable(),
  introHtml: yup.string().nullable()
};

const FormSchemaAfterStarted = {
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
  formSchema() {
    if (this.props.ensureComplete) {
      // i.e. campaign.isStarted
      return yup.object(FormSchemaAfterStarted);
    }
    return yup.object(FormSchemaBeforeStarted);
  }

  render() {
    return (
      <div>
        <CampaignFormSectionHeading title="What's your campaign about?" />
        <GSForm
          schema={this.formSchema()}
          value={this.props.formValues}
          onChange={this.props.onChange}
          onSubmit={this.props.onSubmit}
          {...dataTest("campaignBasicsForm")}
        >
          <Form.Field
            as={GSTextField}
            {...dataTest("title")}
            name="title"
            label="Title (required)"
            helpertext="e.g. Election Day 2016"
            fullWidth
          />
          <Form.Field
            as={GSTextField}
            {...dataTest("description")}
            name="description"
            label="Description (required)"
            helpertext="Get out the vote"
            fullWidth
          />
          <Form.Field
            as={GSDateField}
            {...dataTest("dueBy")}
            name="dueBy"
            label="Due date (required)"
            locale="en-US"
            shouldDisableDate={date => moment(date).diff(moment()) < 0}
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
            helpertext="https://www.mysite.com/images/logo.png"
            fullWidth
          />
          <Form.Field
            as={GSColorPicker}
            name="primaryColor"
            label="Primary color"
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
