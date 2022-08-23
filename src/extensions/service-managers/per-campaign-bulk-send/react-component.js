/* eslint no-console: 0 */
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { getConfig } from "../../../server/api/lib/config";

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      perCampaignBulkSend: props.serviceManagerInfo.data.perCampaignBulkSend
    };
  }

  render() {
    const bulkSendChunkSize = parseInt(
      getConfig("BULK_SEND_CHUNK_SIZE", this.props.organization)
    );
    const formSchema = yup.object({
      perCampaignBulkSend: yup.boolean()
    });
    return (
      <div>
        {getConfig("ALLOW_SEND_ALL", this.props.organization) &&
        Number.isInteger(bulkSendChunkSize) &&
        bulkSendChunkSize > 0 ? (
          <div>
            {!this.props.campaign.isStarted ? (
              <GSForm
                schema={formSchema}
                defaultValue={
                  (this.props.serviceManagerInfo &&
                    this.props.serviceManagerInfo.data) ||
                  {}
                }
                onSubmit={() => {
                  this.props.onSubmit({
                    perCampaignBulkSend: this.state.perCampaignBulkSend
                  });
                }}
              >
                <Form.Field
                  as={props => (
                    <FormControlLabel
                      color="primary"
                      control={
                        <Switch
                          checked={this.state.perCampaignBulkSend}
                          onChange={() => {
                            this.setState({
                              perCampaignBulkSend: !this.state
                                .perCampaignBulkSend
                            });
                          }}
                        />
                      }
                      labelPlacement="start"
                      label="Allow bulk send for this campaign"
                    />
                  )}
                  name="perCampaignBulkSend"
                />
                <br />
                <Form.Submit as={GSSubmitButton} label="Save" />
              </GSForm>
            ) : (
              <div>
                Bulk send is {!this.state.perCampaignBulkSend ? "not " : ""}
                enabled!
              </div>
            )}
          </div>
        ) : (
          <div>
            Valid "ALLOW_SEND_ALL" and "BULK_SEND_CHUNK_SIZE" environment
            variables are required for the Per Campaign Bulk Send service
            manager
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
    this.state = {
      perCampaignBulkSend: props.serviceManagerInfo.data.perCampaignBulkSend
    };
  }

  render() {
    return (
      <div>
        Bulk send is {!this.state.perCampaignBulkSend ? "not " : ""}enabled!
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
