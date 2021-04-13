import type from "prop-types";
import React from "react";
import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import GSTextField from "../components/forms/GSTextField";
import * as yup from "yup";
import Form from "react-formal";
import OrganizationJoinLink from "./OrganizationJoinLink";
import Toggle from "material-ui/Toggle";
import { dataTest } from "../lib/attributes";
import cloneDeep from "lodash/cloneDeep";
import TagChips from "./TagChips";
import theme from "../styles/theme";
import RaisedButton from "material-ui/RaisedButton";

export default class CampaignDynamicAssignmentForm extends React.Component {
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
    const { useDynamicAssignment, batchPolicies } = this.state;
    const unselectedPolicies = organization.batchPolicies
      .filter(p => !batchPolicies.find(cur => cur === p))
      .map(p => ({ id: p, name: p }));
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
                as={GSTextField}
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
                    backgroundColor: theme.colors.white,
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
                    backgroundColor: theme.colors.lightGray,
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
            onClick={this.props.onSubmit}
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
  batchSize: type.string
};
