/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("testfakedata OrgConfig", this.props);
    const formSchema = yup.object({
      savedText: yup
        .string()
        .nullable()
        .max(64)
    });
    return (
      <div>
        THIS IS TEST_FAKE_DATA
        <GSForm
          schema={formSchema}
          defaultValue={this.props.serviceManagerInfo.data}
          onSubmit={x => {
            console.log("onSubmit", x);
            this.props.onSubmit(x);
          }}
        >
          <Form.Field
            as={GSTextField}
            label="Some saveable text"
            name="savedText"
            fullWidth
          />
          <Form.Submit
            as={GSSubmitButton}
            label="Save"
            style={this.props.inlineStyles.dialogButton}
          />
        </GSForm>
      </div>
    );
  }
}

OrgConfig.propTypes = {
  organizationId: PropTypes.string,
  serviceManagerInfo: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("testfakedata CampaignConfig", this.props);
    const formSchema = yup.object({
      savedText: yup
        .string()
        .nullable()
        .max(64)
    });
    return (
      <div>
        THIS IS TEST_FAKE_DATA
        {!this.props.campaign.isStarted ? (
          <GSForm
            schema={formSchema}
            defaultValue={this.props.serviceManagerInfo.data}
            onSubmit={x => {
              console.log("onSubmit", x);
              this.props.onSubmit(x);
            }}
          >
            <Form.Field
              as={GSTextField}
              label="Some saveable text"
              name="savedText"
              fullWidth
            />
            <Form.Submit as={GSSubmitButton} label="Save" />
          </GSForm>
        ) : (
          <div>
            Campaign is now started! {this.props.serviceManagerInfo.data.foo}
          </div>
        )}
      </div>
    );
  }
}

CampaignConfig.propTypes = {
  user: PropTypes.object,
  campaign: PropTypes.object,
  serviceManagerInfo: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};

export class CampaignStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("testfakedata CampaignStats", this.props);
    const formSchema = yup.object({});
    return (
      <div>
        THIS IS TEST_FAKE_DATA {this.props.serviceManagerInfo.data.foo}
        {!this.props.campaign.isStarted ? (
          <GSForm
            schema={formSchema}
            onSubmit={x => {
              console.log("onSubmit", x);
              this.props.onSubmit({ a: "b" });
            }}
          >
            <Form.Submit
              as={GSSubmitButton}
              label="Beep Boop"
              component={GSSubmitButton}
            />
          </GSForm>
        ) : (
          <div>
            Campaign is now started! {this.props.serviceManagerInfo.data.foo}
          </div>
        )}
      </div>
    );
  }
}

CampaignStats.propTypes = {
  user: PropTypes.object,
  campaign: PropTypes.object,
  serviceManagerInfo: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
