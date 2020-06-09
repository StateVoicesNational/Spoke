import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import theme from "../styles/theme";
import DisplayLink from "../components/DisplayLink";
import { StyleSheet, css } from "aphrodite";
import { Table, TableBody, TableRow, TableRowColumn } from "material-ui/Table";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  header: {
    ...theme.text.header
  }
});

class AdminCampaignMessagingService extends React.Component {
  render() {
    const campaign = this.props.data.campaign;
    const messagingServiceUrl = `https://www.twilio.com/console/sms/services/${campaign.messageserviceSid}/`;
    return (
      <div>
        <div className={css(styles.header)}>
          {campaign.title}
          <br />
          Campaign ID: {campaign.id}
          <br />
          <DisplayLink
            url={messagingServiceUrl}
            textContent={"Messaging Service URL:"}
          />
          <br />
          Total Phone Numbers: {campaign.phoneNumbers.length}
        </div>
        <div>
          <Table selectable={false}>
            <TableBody displayRowCheckbox={false} showRowHover>
              {campaign.phoneNumbers.map(phoneNumber => (
                <TableRow key={phoneNumber}>
                  <TableRowColumn>{phoneNumber}</TableRowColumn>
                </TableRow>
              ))}
              ;
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
}

AdminCampaignMessagingService.propTypes = {
  params: PropTypes.object,
  messagingService: PropTypes.object,
  router: PropTypes.object,
  organizationId: PropTypes.string,
  campaignId: PropTypes.string,
  data: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          messageserviceSid
          phoneNumbers
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.params.organizationId,
        campaignId: ownProps.params.campaignId
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(withRouter(AdminCampaignMessagingService));
