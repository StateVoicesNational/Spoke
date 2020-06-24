import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import apolloClient from "../network/apollo-client-singleton";

const fetchPeople = async (
  offset,
  limit,
  organizationId,
  campaignsFilter,
  sortBy
) =>
  apolloClient.query({
    query: gql`
      query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
        $sortBy: SortPeopleBy
      ) {
        people(
          organizationId: $organizationId
          cursor: $cursor
          campaignsFilter: $campaignsFilter
          sortBy: $sortBy
        ) {
          ... on PaginatedUsers {
            pageInfo {
              offset
              limit
              total
            }
            users {
              id
              displayName
              email
              roles(organizationId: $organizationId)
            }
          }
        }
      }
    `,
    variables: {
      cursor: { offset, limit },
      organizationId,
      campaignsFilter,
      sortBy
    },
    fetchPolicy: "network-only"
  });

export class PaginatedUsersRetriever extends Component {
  static propTypes = {
    organizationId: PropTypes.string.isRequired,
    campaignsFilter: PropTypes.shape({
      isArchived: PropTypes.bool,
      campaignId: PropTypes.number
    }),
    sortBy: PropTypes.string,
    onUsersReceived: PropTypes.func.isRequired,
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

    const { organizationId, campaignsFilter, pageSize, sortBy } = this.props;

    let offset = 0;
    let total = undefined;
    let users = [];
    do {
      const results = await fetchPeople(
        offset,
        pageSize,
        organizationId,
        campaignsFilter,
        sortBy || "FIRST_NAME"
      );
      const { pageInfo, users: newUsers } = results.data.people;
      users = users.concat(newUsers);
      offset += pageSize;
      total = pageInfo.total;
      this.props.onUsersReceived(users);
    } while (offset < total);

    // this.props.onUsersReceived(users);
  };

  render() {
    return null;
  }
}

export default PaginatedUsersRetriever;
