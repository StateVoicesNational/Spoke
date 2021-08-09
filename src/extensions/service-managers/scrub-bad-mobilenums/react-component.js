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
      scrubBadMobileNumsFreshStart,
      scrubBadMobileNumsFinished,
      scrubBadMobileNumsFinishedCount,
      scrubBadMobileNumsGettable,
      scrubBadMobileNumsCount,
      scrubBadMobileNumsFinishedDeleteCount,
      scrubBadMobileNumsDeletedOnUpload
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
    const states = {
      A_NOT_CONFIGURED: 0, // vendor service without lookup implementation
      B_NEEDS_UPLOAD: 1, // contacts not uploaded
      C_NEEDS_RUN: 3, // contacts uploaded, needs run (or does not)
      D_PROCESSING: 4, // currently processing (button pressed
      E_PROCESS_COMPLETE: 5, // process completed
      F_CAMPAIGN_STARTED: 6 // campaign started
    };
    let scrubState = null;
    if (isStarted) {
      scrubState = states.F_CAMPAIGN_STARTED;
    } else if (scrubBadMobileNumsFinished) {
      scrubState = states.E_PROCESS_COMPLETE;
    } else if (scrubJobs.length) {
      scrubState = states.D_PROCESSING;
    } else if (contactsCount) {
      scrubState = states.C_NEEDS_RUN;
    } else if (scrubBadMobileNumsGettable) {
      scrubState = states.B_NEEDS_UPLOAD;
    } else {
      scrubState = states.A_NOT_CONFIGURED;
    }

    return isStarted ? null : (
      <GSForm
        schema={yup.object({})}
        defaultValue={{}}
        onSubmit={x => {
          console.log("onSubmit", x);
          this.props.onSubmit({ lookupAndScrub: true });
        }}
      >
        {scrubState === states.A_NOT_CONFIGURED && (
          <p>
            The current vendor to send text messages does not support contact
            lookup in Spoke. Please contact your administrator to disable this
            feature or enable a vendor that supports contact lookup.
          </p>
        )}
        {scrubState === states.B_NEEDS_UPLOAD && (
          <p>
            This is a required step to lookup numbers you&rsquo;ve uploaded, but
            FIRST you need to upload your contacts -- go to the Contacts section
            and upload your list -- then check back here to look them up.
          </p>
        )}
        {scrubState === states.C_NEEDS_RUN && (
          <div>
            <p>
              This is a required step to lookup numbers you&rsquo;ve uploaded,
              however, looking them up costs money, so only trigger this lookup
              before starting the campaign. If you upload a new set of numbers,
              we&rsquo;ll have to look them up again?!
            </p>
            {scrubBadMobileNumsCount && (
              <p>
                You will need to lookup {scrubBadMobileNumsCount} numbers
                (having leveraged past lookups).
              </p>
            )}
          </div>
        )}
        {scrubState === states.D_PROCESSING && (
          <p>
            Processing numbers..... Progress {scrubJobs.status}%
            {scrubBadMobileNumsCount && (
              <div>{scrubBadMobileNumsCount} lookups required</div>
            )}
          </p>
        )}
        {scrubState === states.E_PROCESS_COMPLETE && <p>Lookups complete!</p>}
        {scrubBadMobileNumsFinishedCount && (
          <p>
            <b>{scrubBadMobileNumsFinishedCount}</b> numbers were looked up for
            this campaign.
          </p>
        )}
        {scrubBadMobileNumsFinishedDeleteCount && (
          <p>
            <b>{scrubBadMobileNumsFinishedDeleteCount}</b> landlines were
            deleted from the campaign.
          </p>
        )}
        {scrubBadMobileNumsDeletedOnUpload && (
          <p>
            <b>{scrubBadMobileNumsDeletedOnUpload}</b> landlines were removed
            during campaign upload based on saved lookup data.
          </p>
        )}

        {scrubState === states.C_NEEDS_RUN && (
          <Form.Submit
            as={GSSubmitButton}
            label="Lookup numbers and scrub landlines"
          />
        )}
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
