import type from "prop-types";
import React from "react";
import yup from "yup";
import Form from "react-formal";
import Popover from "material-ui/Popover";
import FlatButton from "material-ui/FlatButton";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import loadData from "../../../containers/hoc/load-data";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import { List, ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import NavigationExpandMore from "material-ui/svg-icons/navigation/expand-more";
import NavigationExpandLess from "material-ui/svg-icons/navigation/expand-less";
import theme from "../../../styles/theme";
import AutoComplete from "material-ui/AutoComplete";
import { css } from "aphrodite";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";
import { dataSourceItem } from "../../../components/utils";
import { getHighestRole } from "../../../lib/permissions";

export const displayName = () => "Admin Controls";

export const showSidebox = ({ currentUser }) => {
  // Return anything False-y to not show
  // Return anything Truth-y to show
  // Return 'popup' to force a popup on mobile screens (instead of letting it hide behind a button)
  return currentUser.roles.includes("ADMIN");
};

export class TexterSideboxClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: {},
      selectedRole: ""
    };
  }

  handleListToggle = id => () => {
    const { expanded } = this.state;
    if (expanded[id]) {
      this.setState({ expanded: { ...expanded, [id]: false } });
    } else {
      this.setState({ expanded: { ...expanded, [id]: true } });
    }
  };

  handleRoleChange = (event, index, value) => {
    this.setState({ selectedRole: value });
  };

  handleRoleSubmit = async () => {
    await this.props.mutations.editOrganizationRoles(
      this.props.campaign.organization.id,
      this.props.campaign.id,
      this.props.texter.id,
      [this.state.selectedRole]
    );
    this.setState({ selectedRole: "" });
  };

  handleReassignChanged = (selection, index) => {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = this.props.data.people.users.find(texter => {
        this.setState({ reassignTo: undefined });
        return texter.displayName === selection;
      });
      if (texter) {
        texterUserId = texter.id;
      }
    } else {
      texterUserId = selection.value.key;
    }
    if (texterUserId) {
      this.setState({ reassignTo: parseInt(texterUserId, 10) });
    } else {
      this.setState({ reassignTo: undefined });
    }
  };

  handleReassignRequested = () => {
    this.props.mutations.reassignCampaignContacts(
      this.props.campaign.organization.id,
      [
        {
          campaignId: this.props.campaign.id,
          campaignContactId: this.props.contact.id,
          messageIds: this.props.contact.messages.map(message => message.id)
        }
      ],
      this.state.reassignTo
    );
  };

  render() {
    const {
      campaign,
      assignment,
      contact,
      settingsData,
      messageStatusFilter,
      texter
    } = this.props;
    console.log(this.props);
    const { selectedRole } = this.state;
    const roles = ["SUSPENDED", "VETTED_TEXTER"];

    const texterNodes = !this.props.data.people.users
      ? []
      : this.props.data.people.users.map(user => {
          const userId = parseInt(user.id, 10);
          const label = `${user.displayName} ${getHighestRole(user.roles)}`;
          return dataSourceItem(label, userId);
        });

    const rightIconButton = id => (
      <IconButton
        style={{ padding: 0, width: 20, height: 20 }}
        iconStyle={{ height: 20, width: 20 }}
        onClick={this.handleListToggle(id)}
      >
        {this.state.expanded[id] ? (
          <NavigationExpandLess />
        ) : (
          <NavigationExpandMore />
        )}
      </IconButton>
    );

    const StyledListItem = props => (
      <ListItem {...props} style={{ fontSize: "90%", padding: 4 }} disabled />
    );
    const NestedListItem = props => (
      <StyledListItem
        {...props}
        open={this.state.expanded[props.id]}
        rightIconButton={rightIconButton(props.id)}
      />
    );

    const { firstName, lastName, cell, ...otherContactItems } = contact;
    // const nestedItems = Object.keys(otherContactItems).map(key => {
    //   let newKey = key.split(/(?=[A-Z])/);
    //   newKey[0] = newKey[0].charAt(0).toUpperCase() + newKey[0].slice(1);
    //   newKey = newKey.join(" ");
    //   let value = otherContactItems[key];
    //   if (typeof value === "object") value = JSON.stringify(value);
    //   return <ListItem {...listItemProps} primaryText={`${newKey}: ${value}`} />
    // });

    const formatKey = key => {
      const newKey = key.split(/(?=[A-Z])/);
      newKey[0] = newKey[0].charAt(0).toUpperCase() + newKey[0].slice(1);
      return newKey.join(" ");
    };

    const nestItems = obj => {
      const nestedItems = [];
      Object.keys(obj).forEach((key, id) => {
        if (key.indexOf("__typename") > -1) return;
        const value = obj[key];
        if (Array.isArray(value) && value.length > 0) {
          nestedItems.push(
            <NestedListItem
              id={id}
              primaryText={formatKey(key)}
              nestedItems={value.map((el, id2) => {
                if (typeof el === "object" && value !== null) {
                  return (
                    <NestedListItem
                      id={`${id}-arr-${id2}`}
                      primaryText={id2 + 1}
                      nestedItems={nestItems(el)}
                    />
                  );
                }
                return <StyledListItem primaryText={el} />;
              })}
            />
          );
        } else if (
          typeof value === "object" &&
          value !== null &&
          Object.keys(value).length > 0
        ) {
          nestedItems.push(
            <NestedListItem
              id={id}
              primaryText={formatKey(key)}
              nestedItems={nestItems(value)}
            />
          );
        } else {
          nestedItems.push(
            <StyledListItem primaryText={`${formatKey(key)}: ${value}`} />
          );
        }
      });
      return nestedItems;
    };

    return (
      <div>
        <div>ADMIN</div>
        <div>Contact info</div>
        <List style={{ textAlign: "left" }}>
          <StyledListItem primaryText={`Name: ${firstName}${lastName}`} />
          <StyledListItem primaryText={`Cell: ${cell}`} />
          <NestedListItem
            id="more"
            primaryText="More Info"
            nestedItems={nestItems(otherContactItems)}
          />
        </List>
        <SelectField
          hintText="Change Role"
          value={selectedRole}
          onChange={this.handleRoleChange}
          style={{ fontSize: theme.text.body.fontSize }}
          iconStyle={{ fill: theme.colors.gray }}
          fullWidth
        >
          {roles.map(option => (
            <MenuItem
              key={option}
              value={option}
              style={{ fontSize: theme.text.body.fontSize }}
              primaryText={`${option.charAt(0).toUpperCase()}${option
                .substring(1)
                .replace("_", " ")
                .toLowerCase()}`}
            />
          ))}
        </SelectField>
        <div>
          <FlatButton
            label={"Change role"}
            onClick={this.handleRoleSubmit}
            disabled={!this.state.selectedRole}
            className={css(flexStyles.flatButton)}
            labelStyle={inlineStyles.flatButtonLabel}
          />
        </div>
        <AutoComplete
          textFieldStyle={{ fontSize: theme.text.body.fontSize }}
          filter={AutoComplete.caseInsensitiveFilter}
          maxSearchResults={8}
          onFocus={() =>
            this.setState({
              reassignTo: undefined,
              texterSearchText: ""
            })
          }
          onUpdateInput={texterSearchText =>
            this.setState({ texterSearchText })
          }
          searchText={this.state.texterSearchText}
          dataSource={texterNodes}
          hintText={"Search for a texter"}
          floatingLabelText={"Reassign to ..."}
          onNewRequest={this.handleReassignChanged}
          fullWidth
        />
        <div>
          <FlatButton
            label={"Reassign selected"}
            onClick={this.handleReassignRequested}
            disabled={!this.state.reassignTo}
            className={css(flexStyles.flatButton)}
            labelStyle={inlineStyles.flatButtonLabel}
          />
        </div>
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  router: type.object,
  mutations: type.object,

  // data
  data: type.object,
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,

  // parent state
  navigationToolbarChildren: type.object,
  messageStatusFilter: type.string
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
        organizationId: ownProps.campaign.organization.id,
        sortBy: "FIRST_NAME"
      },
      fetchPolicy: "network-only"
    })
  }
};

export const mutations = {
  editOrganizationRoles: ownProps => (
    organizationId,
    campaignId,
    userId,
    roles
  ) => ({
    mutation: gql`
      mutation editOrganizationRoles(
        $organizationId: String!
        $userId: String!
        $roles: [String]
        $campaignId: String
      ) {
        editOrganizationRoles(
          organizationId: $organizationId
          userId: $userId
          roles: $roles
          campaignId: $campaignId
        ) {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    variables: {
      organizationId,
      userId,
      roles,
      campaignId
    }
  }),
  reassignCampaignContacts: ownProps => (
    organizationId,
    campaignIdsContactIds,
    newTexterUserId
  ) => ({
    mutation: gql`
      mutation reassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserId: String!
      ) {
        reassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserId: $newTexterUserId
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserId }
  })
};

export const TexterSidebox = loadData({ mutations, queries })(
  withRouter(TexterSideboxClass)
);

export const adminSchema = () => ({});

export class AdminConfig extends React.Component {
  render() {
    return <div></div>;
  }
}

AdminConfig.propTypes = {
  settingsData: type.object,
  onToggle: type.func
};
