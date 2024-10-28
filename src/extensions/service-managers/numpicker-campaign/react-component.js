import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import GSForm from "../../../components/forms/GSForm";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import { dataSourceItem } from "../../../components/utils";
import { getDisplayPhoneNumber } from "../../../lib/phone-format";

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    const selectedNumbers = this.props.serviceManagerInfo.data.campaignNumbers || [];
    this.state = {
      selectedNumbers: selectedNumbers.map(n =>
        dataSourceItem(getDisplayPhoneNumber(n), n))
    };
  }

  onNumberSelected = (event, selection) => {
    this.setState({selectedNumbers: selection});
  }

  render() {
    const selected = this.props.serviceManagerInfo.data.campaignNumbers || []
      .map(n => getDisplayPhoneNumber(n))
      .join(', ');

    const numberOptions =
      this.props.serviceManagerInfo &&
      this.props.serviceManagerInfo.data &&
      this.props.serviceManagerInfo.data.availableNumbers &&
      this.props.serviceManagerInfo.data.availableNumbers.map(n =>
        dataSourceItem(getDisplayPhoneNumber(n), n));
    return (
      <div>
        Select the phone number(s) to use for this campaign.
        {!this.props.campaign.isStarted || !selected ? (
          <GSForm
            onSubmit={() => {
              this.props.onSubmit(this.state.selectedNumbers.map(n => n.rawValue));
            }}
          >
            <Autocomplete
              multiple
              options={numberOptions}
              onChange={this.onNumberSelected}
              getOptionLabel={option => option.text || ""}
              value={this.state.selectedNumbers || []}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select a number"
                  placeholder="Search for a number"
                />
              )}
            />
            <Form.Submit as={GSSubmitButton} label="Save" />
          </GSForm>
        ) : (
          <div>Using numbers: {selected}</div>
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
