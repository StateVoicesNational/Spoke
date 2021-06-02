/* eslint no-console: 0 */
import type from "prop-types";
import React from "react";
import gql from "graphql-tag";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import Dialog from "material-ui/Dialog";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import * as yup from "yup";
import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import Toggle from "material-ui/Toggle";
import moment from "moment";
import CampaignTexterUIForm from "../components/CampaignTexterUIForm";
import OrganizationFeatureSettings from "../components/OrganizationFeatureSettings";
import { getServiceVendorComponent } from "../extensions/service-vendors/components";
import { getServiceManagerComponent } from "../extensions/service-managers/components";
import GSTextField from "../components/forms/GSTextField";

export class CampaignServiceVendors extends React.Component {
  static propTypes = {
    formValues: type.object,
    onChange: type.func,
    customFields: type.array,
    saveLabel: type.string,
    campaign: type.object,
    organization: type.object,
    onSubmit: type.func,
    saveDisabled: type.bool,
    isStarted: type.bool,
    serviceManagerComponentName: type.string
  };

  render() {
    const { campaign, organization, serviceManagerComponentName } = this.props;
    if (!campaign.serviceManagers.length) {
      return null;
    }
    const allFullyConfigured = campaign.serviceManagers
      .map(sm => sm.fullyConfigured !== false)
      .reduce((a, b) => a && b, true);
    return (
      <div>
        {campaign.serviceManagers.map(sm => {
          const ServiceManagerComp = getServiceManagerComponent(
            sm.name,
            serviceManagerComponentName
          );
          const serviceManagerName = sm.name;
          if (!ServiceManagerComp) {
            return null;
          }
          return (
            <Card>
              {serviceManagerComponentName === "CampaignConfig" ? (
                <CardHeader
                  title={sm.displayName}
                  style={{
                    backgroundColor:
                      sm.fullyConfigured === true
                        ? theme.colors.green
                        : sm.fullyConfigured === false
                        ? theme.colors.yellow
                        : theme.colors.lightGray
                  }}
                />
              ) : null}
              <CardText>
                <ServiceManagerComp
                  serviceManagerInfo={sm}
                  campaign={campaign}
                  organization={organization}
                  saveLabel={this.props.saveLabel}
                  onSubmit={updateData =>
                    this.props.onSubmit(serviceManagerName, updateData)
                  }
                />
              </CardText>
            </Card>
          );
        })}
      </div>
    );
  }
}

export default CampaignServiceVendors;
