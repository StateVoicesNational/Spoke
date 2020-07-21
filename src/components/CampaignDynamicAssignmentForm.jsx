import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import OrganizationJoinLink from "./OrganizationJoinLink";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";
import cloneDeep from "lodash/cloneDeep";

export default class CampaignDynamicAssignmentForm extends React.Component {
  state = {
    ...this.props.formValues
  };

  onChange = formValues => {
    this.setState(formValues);
    this.props.onChange({
      ...this.state,
      ...formValues
    });
  };

  toggleChange = (key, val) => {
    this.setState({ [key]: val });

    const formValues = cloneDeep(this.props.formValues);
    formValues[key] = val;

    this.props.onChange({
      ...this.state,
      ...formValues
    });
  };

  formSchema = yup.object({
    batchSize: yup.number().integer(),
    requestAfterReply: yup.boolean()
  });

  render() {
    const { joinToken, campaignId } = this.props;
    const { useDynamicAssignment, requestAfterReply } = this.state;

    return (
      <div>
        <Toggle
          {...dataTest("useDynamicAssignment")}
          label="Allow texters with a link to join and start texting when the campaign is started?"
          toggled={useDynamicAssignment}
          onToggle={(toggler, val) =>
            this.toggleChange("useDynamicAssignment", val)
          }
        />
        <GSForm
          schema={this.formSchema}
          value={this.state}
          onChange={this.onChange}
        >
          {!useDynamicAssignment ? null : (
            <div>
              <ul>
                <li>
                  {joinToken ? (
                    <OrganizationJoinLink
                      organizationUuid={joinToken}
                      campaignId={campaignId}
                    />
                  ) : (
                    "Please save the campaign and reload the page to get the join link to share with texters."
                  )}
                </li>
                <li>
                  You can turn off dynamic assignment after starting a campaign
                  to disallow more new texters to join
                </li>
              </ul>
              <p>
                Batch sizes are how many texts someone should send before they
                switch to replying.
              </p>
              <Form.Field
                name="batchSize"
                type="number"
                label="How large should a batch be?"
                initialValue={200}
              />
              <Toggle
                label="Require texters to request more texts after replies?"
                toggled={requestAfterReply}
                onToggle={(toggler, val) => {
                  this.toggleChange("requestAfterReply", val);
                }}
              />
            </div>
          )}
          <Form.Button
            type="submit"
            onTouchTap={this.props.onSubmit}
            label={this.props.saveLabel}
            disabled={this.props.saveDisabled}
            {...dataTest("submitCampaignDynamicAssignmentForm")}
          />
        </GSForm>
      </div>
    );
  }
}

CampaignDynamicAssignmentForm.propTypes = {
  onChange: type.func,
  ensureComplete: type.bool,
  organizationId: type.string,
  campaignId: type.string,
  formValues: type.object,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool,
  joinToken: type.string,
  batchSize: type.string
};
