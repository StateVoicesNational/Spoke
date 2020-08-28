import { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import apolloClient from "../network/apollo-client-singleton";

const fetchPeople = async (
  offset,
  limit,
  organizationId,
  campaignsFilter,
  sortBy,
  role
) =>
  apolloClient.query({
    query: gql`
      query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
        $sortBy: SortPeopleBy
        $role: String
      ) {
        people(
          organizationId: $organizationId
          cursor: $cursor
          campaignsFilter: $campaignsFilter
          sortBy: $sortBy
          role: $role
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
      sortBy,
      role
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
    pageSize: PropTypes.number.isRequired,
    roleFilter: PropTypes.string
  };

  componentDidMount() {
    this.handlePropsReceived();
  }

  componentDidUpdate(prevProps) {
    this.handlePropsReceived(prevProps);
  }

  handlePropsReceived = async (prevProps = {}) => {
    if (isEqual(prevProps, this.props)) return;

    const {
      organizationId,
      campaignsFilter,
      pageSize,
      sortBy,
      onUsersReceived,
      roleFilter
    } = this.props;

    let offset = 0;
    let total = undefined;
    let users = [];
    do {
      const results = await fetchPeople(
        offset,
        pageSize,
        organizationId,
        campaignsFilter,
        sortBy || "FIRST_NAME",
        roleFilter
      );
      const { pageInfo, users: newUsers } = results.data.people;
      users = users.concat(newUsers);
      offset += pageSize;
      total = pageInfo.total;
      onUsersReceived(users);
    } while (offset < total);
  };

  render() {
    return null;
  }
}

export default PaginatedUsersRetriever;
