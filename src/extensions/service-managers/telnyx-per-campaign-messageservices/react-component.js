/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("telnyx messaging profile id CampaignConfig", this.props);
    const foo =
      this.props.serviceManagerInfo &&
      this.props.serviceManagerInfo.data &&
      this.props.serviceManagerInfo.data.messageservice_sid;

    const formSchema = yup.object({
      messageservice_sid: yup
        .string()
        .nullable()
        .max(64)
    });
    return (
      <div>
        Telnyx messaging profile ID
        {!this.props.campaign.isStarted ? (
          <GSForm
            schema={formSchema}
            defaultValue={
              (this.props.serviceManagerInfo &&
                this.props.serviceManagerInfo.data) ||
              {}
            }
            onSubmit={x => {
              console.log("onSubmit", x);
              this.props.onSubmit(x);
            }}
          >
            <Form.Field
              as={GSTextField}
              label="Message profile id"
              name="messageservice_sid"
              fullWidth
            />
            <Form.Submit as={GSSubmitButton} label="Save" />
          </GSForm>
        ) : (
          <div>Campaign has message profile id! {foo}</div>
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