/* eslint no-console: 0 */
import type from "prop-types";
import React from "react";
import gql from "graphql-tag";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import * as yup from "yup";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
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
              <CardContent>
                <ServiceManagerComp
                  serviceManagerInfo={sm}
                  campaign={campaign}
                  organization={organization}
                  saveLabel={this.props.saveLabel}
                  onSubmit={updateData =>
                    this.props.onSubmit(serviceManagerName, updateData)
                  }
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
}

export default CampaignServiceVendors;
