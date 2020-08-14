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
    responseWindow: yup.number()
  });

  render() {
    const { joinToken, campaignId } = this.props;
    const { useDynamicAssignment } = this.state;

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
            </div>
          )}
          {window.TEXTER_SIDEBOXES &&
          !/dynamicassign/.test(window.TEXTER_SIDEBOXES) ? (
            <div>
              Warning: Spoke may be misconfigured: dynamic assignment depends on
              TEXTER_SIDEBOXES= to include "default-dynamicassignment" or a
              replacement dynamicassignment sidebox.
            </div>
          ) : null}
          <div>
            <Form.Field
              name="responseWindow"
              type="number"
              label="Expected Response Window (hours)"
            />
            <p style={{ paddingLeft: "8px" }}>
              How long (in hours) before we should consider reassignment without
              a texter response. This relates to the "Expired Needs Response"
              message status filter in Message Review. You might set this to 48
              hours for slower campaigns or 2 hours or less for GOTV campaigns.
            </p>
          </div>
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
  responseWindow: type.number,
  batchSize: type.string
};
