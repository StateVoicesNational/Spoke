import { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import apolloClient from "../network/apollo-client-singleton";

export const campaignsQuery = gql`
  query qq(
    $organizationId: String!
    $cursor: OffsetLimitCursor
    $campaignsFilter: CampaignsFilter
  ) {
    campaigns(
      organizationId: $organizationId
      cursor: $cursor
      campaignsFilter: $campaignsFilter
    ) {
      ... on PaginatedCampaigns {
        pageInfo {
          offset
          limit
          total
        }
        campaigns {
          dueBy
          title
          id
        }
      }
    }
  }
`;

const fetchCampaigns = async (offset, limit, organizationId, campaignsFilter) =>
  apolloClient.query({
    query: campaignsQuery,
    variables: {
      cursor: { offset, limit },
      organizationId,
      campaignsFilter
    },
    fetchPolicy: "network-only"
  });

export class PaginatedCampaignsRetriever extends Component {
  static propTypes = {
    organizationId: PropTypes.string.isRequired,
    campaignsFilter: PropTypes.shape({
      isArchived: PropTypes.bool,
      campaignId: PropTypes.number
    }),
    onCampaignsReceived: PropTypes.func.isRequired,
    pageSize: PropTypes.number.isRequired
  };

  componentDidMount() {
    this.handlePropsReceived();
  }

  componentDidUpdate(prevProps) {
    this.handlePropsReceived(prevProps);
  }

  handlePropsReceived = async (prevProps = {}) => {
    if (isEqual(prevProps, this.props)) return;

    const { organizationId, campaignsFilter, pageSize } = this.props;

    let offset = 0;
    let total = undefined;
    let campaigns = [];
    do {
      const results = await fetchCampaigns(
        offset,
        pageSize,
        organizationId,
        campaignsFilter
      );
      const { pageInfo, campaigns: newCampaigns } = results.data.campaigns;
      campaigns = campaigns.concat(newCampaigns);
      offset += pageSize;
      total = pageInfo.total;
    } while (offset < total);

    this.props.onCampaignsReceived(campaigns);
  };

  render() {
    return null;
  }
}

export default PaginatedCampaignsRetriever;
