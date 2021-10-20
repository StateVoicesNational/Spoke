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

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    console.log("twilio-isv OrgConfig", this.props);
    if (
      !this.props.serviceManagerInfo.data ||
      !this.props.serviceManagerInfo.data.policies
    ) {
      return <div>Current Twilio account does not have ISV access</div>;
    }
    const {
      policies,
      profiles,
      brands,
      endUsers
    } = this.props.serviceManagerInfo.data;

    return (
      <div>
        {profiles.map(prof => {
          const profBrands = brands.filter(
            b => b.customerProfileBundleSid === prof.sid
          );
          return (
            <div key={prof.sid}>
              <b>{prof.friendlyName}</b> - {prof.sid} for account{" "}
              {prof.accountSid}
              <div>
                Status: {prof.status}
                <br />
                Created: {prof.dateCreated}
                <br />
                Updated: {prof.dateUpdated}
              </div>
              {profBrands.length ? (
                <ul>
                  <lh>
                    <b>Brands/Brand Registrations</b>
                  </lh>
                  {profBrands.map(bnd => (
                    <li>
                      <i>{bnd.sid}</i> status: {bnd.status}
                      <br />
                      {bnd.failureReason ? `Failure: ${bnd.failureReason}` : ""}
                      {bnd.tcrId ? `tcrId: ${bnd.tcrId}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                ""
              )}
            </div>
          );
        })}
      </div>
    );
  }
}

OrgConfig.propTypes = {
  organizationId: PropTypes.string,
  serviceManagerInfo: PropTypes.object,
  inlineStyles: PropTypes.object,
  styles: PropTypes.object,
  saveLabel: PropTypes.string,
  onSubmit: PropTypes.func
};
