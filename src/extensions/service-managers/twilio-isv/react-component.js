/* eslint no-console: 0 */
import { css } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import DisplayLink from "../../../components/DisplayLink";
import GSForm from "../../../components/forms/GSForm";
import GSTextField from "../../../components/forms/GSTextField";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

export class OrgConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderAddCampaignVerifyTokenForm(brandId) {
    const formSchema = yup.object({
      campaignVerifyToken: yup.string()
    });
    return (
      <div>
        A{" "}
        <a href="https://www.campaignverify.org/" target="_blank">
          CampaignVerify
        </a>
        Token should look something like:
        <code>
          cv|1.0|tcr|10dlc|9975c339-d46f-49b7-a399-2e6d5ebac66d|EXAMPLEjEd8xSlaAgRXAXXBUNBT2AgL-LdQuPveFhEyY
        </code>
        <GSForm
          schema={formSchema}
          onSubmit={async x => {
            console.log("onSubmit", x, brandId);
            const { campaignVerifyToken } = x;
            const res = await this.props.onSubmit({
              command: "addCampaignVerifyToken",
              brandId,
              campaignVerifyToken
            });
            console.log("addCampaignVerifyToken result", res);
          }}
        >
          <Form.Field
            as={GSTextField}
            label="Campaign Verify Token"
            name="campaignVerifyToken"
            fullWidth
          />
          <Form.Submit
            as={GSSubmitButton}
            color="primary"
            variant="outlined"
            label="Submit"
            style={this.props.inlineStyles.dialogButton}
          />
          <Button
            style={this.props.inlineStyles.dialogButton}
            variant="outlined"
            onClick={() => this.setState({ [brandId]: {} })}
          >
            Cancel
          </Button>
        </GSForm>
      </div>
    );
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
                    <li key={bnd.sid}>
                      <div>
                        <i>{bnd.sid}</i> status: {bnd.status}
                        <br />
                        {bnd.failureReason
                          ? `Failure: ${bnd.failureReason}`
                          : ""}
                        {bnd.tcrId ? `tcrId: ${bnd.tcrId}` : ""}
                      </div>
                      {bnd.vettings &&
                      !bnd.vettings.find(
                        v => v.vetting_provider === "campaign-verify"
                      ) ? (
                        <div>
                          {this.state[bnd.sid] &&
                          this.state[bnd.sid].campaignVerifyToken ? (
                            this.renderAddCampaignVerifyTokenForm(bnd.sid)
                          ) : (
                            <div>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  this.setState({
                                    [bnd.sid]: { campaignVerifyToken: true }
                                  })
                                }
                              >
                                Add CV Token
                              </Button>{" "}
                              for{" "}
                              <a
                                href="https://www.campaignverify.org/"
                                target="_blank"
                              >
                                CampaignVerify
                              </a>
                            </div>
                          )}
                        </div>
                      ) : null}
                      <ul>
                        {(bnd.vettings || []).map(v => (
                          <li>
                            Vetting Source: {v.vetting_provider}(
                            {v.vetting_class}):, status: {v.vetting_status}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                ""
              )}
              <br />
            </div>
          );
        })}
        <Button
          style={this.props.inlineStyles.dialogButton}
          variant="outlined"
          onClick={() =>
            this.props.onSubmit({
              command: "clearCache"
            })
          }
        >
          Clear Cache
        </Button>
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
