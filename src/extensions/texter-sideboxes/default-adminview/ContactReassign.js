import React, { Component } from "react";
import type from "prop-types";
import gql from "graphql-tag";
import loadData from "../../../containers/hoc/load-data";
import FlatButton from "material-ui/FlatButton";
import AutoComplete from "material-ui/AutoComplete";
import { css } from "aphrodite";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";
import theme from "../../../styles/theme";
import { dataSourceItem } from "../../../components/utils";
import { getHighestRole } from "../../../lib/permissions";

const ContactReassign = ({
  onFocus,
  onUpdateInput,
  searchText,
  reassignTo,
  data: {
    people: { users }
  },
  onNewRequest,
  onReassignClick
}) => {
  const texterNodes = !users
    ? []
    : users.map(user => {
        const userId = parseInt(user.id, 10);
        const label = `${user.displayName} ${getHighestRole(user.roles)}`;
        return dataSourceItem(label, userId);
      });

  return (
    <div>
      <AutoComplete
        textFieldStyle={{ fontSize: theme.text.body.fontSize }}
        filter={AutoComplete.caseInsensitiveFilter}
        maxSearchResults={8}
        onFocus={onFocus}
        onUpdateInput={onUpdateInput}
        searchText={searchText}
        dataSource={texterNodes}
        hintText={"Search for a texter"}
        floatingLabelText={"Reassign to ..."}
        onNewRequest={onNewRequest(users)}
        fullWidth
      />
      <div>
        <FlatButton
          label={"Reassign"}
          onClick={onReassignClick}
          disabled={!reassignTo}
          className={css(flexStyles.flatButton)}
          labelStyle={inlineStyles.flatButtonLabel}
        />
      </div>
    </div>
  );
};

ContactReassign.propTypes = {
  onFocus: type.func,
  onUpdateInput: type.func,
  searchText: type.string,
  dataSource: type.array,
  reassignTo: type.number,
  onReassignClick: type.func,
  onNewRequest: type.func,
  data: type.object
};

export const queries = {
  data: {
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
    options: ownProps => ({
      variables: {
        cursor: { limit: 1000, offset: 0 },
        organizationId: ownProps.organizationId,
        sortBy: "FIRST_NAME"
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(ContactReassign);
