/* eslint-disable react/no-multi-comp */
/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
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
    const foo =
      this.props.serviceManagerInfo &&
      this.props.serviceManagerInfo.data &&
      this.props.serviceManagerInfo.data.foo;
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
            defaultValue={
              (this.props.serviceManagerInfo &&
                this.props.serviceManagerInfo.data) ||
              {}
            }
            onSubmit={x => {
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
          <div>Campaign is now started! {foo}</div>
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
    const foo =
      this.props.serviceManagerInfo &&
      this.props.serviceManagerInfo.data &&
      this.props.serviceManagerInfo.data.foo;
    const formSchema = yup.object({});
    return (
      <div>
        THIS IS TEST_FAKE_DATA {foo}
        {!this.props.campaign.isStarted ? (
          <GSForm
            schema={formSchema}
            // eslint-disable-next-line no-unused-vars
            onSubmit={x => {
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
          <div>Campaign is now started! {foo}</div>
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
