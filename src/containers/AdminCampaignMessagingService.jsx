import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import theme from "../styles/theme";
import DisplayLink from "../components/DisplayLink";
import { StyleSheet, css } from "aphrodite";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";

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
    const phoneNumbers = campaign.phoneNumbers || [];
    return (
      <div>
        <div className={css(styles.header)}>
          {campaign.title}
          <br />
          Campaign ID: {campaign.id}
          <br />
          {campaign.messageServiceLink ? (
            <DisplayLink
              url={campaign.messageServiceLink}
              textContent={"Messaging Service URL:"}
            />
          ) : null}
          <br />
          Total Phone Numbers: {phoneNumbers.length}
        </div>
        <div>
          <Table>
            <TableBody>
              {phoneNumbers.map(phoneNumber => (
                <TableRow key={phoneNumber}>
                  <TableCell>{phoneNumber}</TableCell>
                </TableRow>
              ))}
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
          messageServiceLink
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
