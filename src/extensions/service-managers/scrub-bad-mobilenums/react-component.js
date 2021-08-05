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

export class CampaignConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("scrub-bad-mobilenums CampaignConfig", this.props);
    const {
      scrubBadMobileNumsFinishedCount,
      scrubBadMobileNumsFinished,
      scrubBadMobileNumsFreshStart,
      scrubBadMobileNumsGettable,
      scrubBadMobileNumsCount
    } = this.props.serviceManagerInfo.data;
    const { isStarted, contactsCount, pendingJobs } = this.props.campaign;
    const scrubJobs = pendingJobs.filter(
      j =>
        j.jobType === "extension_job" &&
        j.resultMessage &&
        j.resultMessage.startsWith("Scrub")
    );
    console.log(
      "scrubJobs",
      scrubJobs,
      "all jobs",
      pendingJobs,
      scrubBadMobileNumsFinishedCount,
      scrubBadMobileNumsFinished,
      scrubBadMobileNumsFreshStart
    );
    // TODO: pendingJobs when type extension_job (and details = xyz?) -- count it as this job
    const canRequest =
      contactsCount && !isStarted && scrubBadMobileNumsGettable;
    const needsToRequest = !scrubBadMobileNumsFinished && !scrubJobs.length;
    // TODO: message for processing
    // TODO: message for nums not gettable
    return isStarted ? null : (
      <GSForm
        schema={yup.object({})}
        defaultValue={{}}
        onSubmit={x => {
          console.log("onSubmit", x);
          this.props.onSubmit({ lookupAndScrub: true });
        }}
      >
        <p>
          This is a required step to lookup numbers you&rsquo;ve uploaded,
          however, looking them up costs money, so only trigger this lookup
          before starting the campaign. If you upload a new set of numbers,
          we&rsquo;ll have to look them up again?!
        </p>
        {scrubBadMobileNumsCount ? (
          <p>
            You will need to lookup {scrubBadMobileNumsCount} numbers (having
            leveraged past lookups).
          </p>
        ) : null}

        {canRequest && needsToRequest ? (
          <Form.Submit
            as={GSSubmitButton}
            label="Lookup numbers and scrub landlines"
          />
        ) : null}
      </GSForm>
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
