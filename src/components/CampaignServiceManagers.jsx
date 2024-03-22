/* eslint no-console: 0 */
import type from "prop-types";
import React from "react";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import { getServiceManagerComponent } from "../extensions/service-managers/components";
import withMuiTheme from "../containers/hoc/withMuiTheme";

export class CampaignServiceManagers extends React.Component {
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
            <Card key={sm.name}>
              {serviceManagerComponentName === "CampaignConfig" ? (
                <CardHeader
                  title={sm.displayName}
                  style={{
                    backgroundColor:
                      sm.fullyConfigured === true
                        ? this.props.muiTheme.palette.success.main
                        : sm.fullyConfigured === false
                        ? this.props.muiTheme.palette.warning.main
                        : this.props.muiTheme.palette.grey[300]
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

export default withMuiTheme(CampaignServiceManagers);
