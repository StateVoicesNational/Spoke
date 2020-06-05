import type from "prop-types";
import React from "react";
import orderBy from "lodash/orderBy";
import Slider from "./Slider";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import OrganizationJoinLink from "./OrganizationJoinLink";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { dataTest } from "../lib/attributes";
import { dataSourceItem } from "./utils";

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

  toggleChange = (toggler, useDynamicAssignment) => {
    this.setState({ useDynamicAssignment });
    this.props.onChange({
      ...this.state,
      useDynamicAssignment
    });
  };

  formSchema = yup.object({
    batchSize: yup.number().integer()
  });

  render() {
    const { joinToken, campaignId } = this.props;
    const { useDynamicAssignment } = this.state;
    const subtitle = useDynamicAssignment ? <div></div> : "";

    return (
      <div>
        <Toggle
          {...dataTest("useDynamicAssignment")}
          label="Allow texters with a link to join and start texting when the campaign is started?"
          toggled={useDynamicAssignment}
          onToggle={this.toggleChange}
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
                <li style={{ display: "none" }}>
                  Batch sizes are how many texts someone should send before they
                  switch to replying This should be a low number (~50-300) for
                  campaigns which expect many replies, and a higher number
                  (~100-1000) for campaigns where deliverability of the first
                  message is more urgent or important (e.g. Get-Out-The-Vote
                  efforts).
                </li>
              </ul>
              <Form.Field
                name="batchSize"
                type="number"
                label="How large should a batch be?"
                initialValue={300}
                style={{ display: "none" }}
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
  joinToken: type.string
};
