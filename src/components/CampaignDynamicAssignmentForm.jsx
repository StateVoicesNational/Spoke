import type from "prop-types";
import React from "react";
import { compose } from "recompose";
import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import GSTextField from "../components/forms/GSTextField";
import * as yup from "yup";
import Form from "react-formal";
import OrganizationJoinLink from "./OrganizationJoinLink";
import OrganizationReassignLink from "./OrganizationReassignLink";
import { dataTest } from "../lib/attributes";
import cloneDeep from "lodash/cloneDeep";
import TagChips from "./TagChips";
import withMuiTheme from "../containers/hoc/withMuiTheme";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

class CampaignDynamicAssignmentForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...props.formValues
    };
    if (!props.formValues.batchPolicies.length) {
      this.state.batchPolicies = [props.organization.batchPolicies[0]];
    }
  }

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
    const { joinToken, campaignId, organization } = this.props;
    const { useDynamicAssignment, batchPolicies, useDynamicReplies } = this.state;
    const unselectedPolicies = organization.batchPolicies
      .filter(p => !batchPolicies.find(cur => cur === p))
      .map(p => ({ id: p, name: p }));
    return (
      <div>
        <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={useDynamicAssignment || false}
              onChange={(toggler, val) => {
                console.log(toggler, val);
                this.toggleChange("useDynamicAssignment", val);
              }}
            />
          }
          label="Allow texters with a link to join and start texting when the campaign is started?"
          labelPlacement="start"
        />
        <br/>
        <GSForm
          schema={this.formSchema}
          value={this.state}
          onChange={this.onChange}
          onSubmit={this.props.onSubmit}
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
                as={GSTextField}
                fullWidth
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
              as={GSTextField}
              fullWidth
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
            <FormControlLabel
          control={
            <Switch
              color="primary"
              checked={useDynamicReplies || false}
              onChange={(toggler, val) => {
                console.log(toggler, val);
                this.toggleChange("useDynamicReplies", val);
              }}
            />
          }
          label="Allow texters with a link to dynamically get assigned replies?"
          labelPlacement="start"
        />

          {!useDynamicReplies ? null : (
            <div>
              <ul>
                <li>
                  {joinToken ? (
                    <OrganizationReassignLink
                      joinToken={joinToken}
                      campaignId={campaignId}
                    />
                  ) : (
                    "Please save the campaign and reload the page to get the reply link to share with texters."
                  )}
                </li>
                <li>
                  You can turn off dynamic assignment after starting a campaign
                  to disallow more new texters to receive replies.
                </li>
              </ul>

              <Form.Field
                as={GSTextField}
                fullWidth
                name="replyBatchSize"
                type="number"
                label="How large should a batch of replies be?"
                initialValue={200}
              />  
            </div>
          )

          }
            {organization.batchPolicies.length > 1 ? (
              <div>
                <h3>Batch Strategy</h3>
                <p>
                  Batch strategies determine the rule for how texters are able
                  to get new batches.
                </p>
                <b>Current Selected:</b>
                <TagChips
                  tags={organization.batchPolicies.map(p => ({
                    id: p,
                    name: p
                  }))}
                  tagIds={batchPolicies}
                  extraProps={(listedTag, i) => ({
                    style: {
                      height: i === 0 ? "30px" : "25px",
                      borderColor: "black",
                      borderWidth: "2px",
                      borderStyle: "solid"
                    },
                    backgroundColor: this.props.muiTheme.palette.grey[50],
                    onRequestDelete:
                      i === 0
                        ? null
                        : () => {
                            this.onChange({
                              batchPolicies: batchPolicies.filter(
                                p => p !== listedTag.id
                              )
                            });
                          }
                  })}
                />
                <span>Alternative Options: </span>
                <TagChips
                  tags={unselectedPolicies}
                  tagIds={unselectedPolicies.map(p => p.id)}
                  extraProps={listedTag => ({
                    backgroundColor: this.props.muiTheme.palette.grey[300],
                    onClick: evt => {
                      if (evt.ctrlKey || evt.altKey) {
                        this.onChange({
                          batchPolicies: [...batchPolicies, listedTag.id]
                        });
                      } else {
                        this.onChange({ batchPolicies: [listedTag.id] });
                      }
                    }
                  })}
                />
              </div>
            ) : null}
          </div>
          <Form.Submit
            as={GSSubmitButton}
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
  organization: type.object,
  onSubmit: type.func,
  saveLabel: type.string,
  saveDisabled: type.bool,
  joinToken: type.string,
  responseWindow: type.number,
  batchSize: type.string,
  replyBatchSize: type.string
};

export default compose(withMuiTheme)(CampaignDynamicAssignmentForm);
