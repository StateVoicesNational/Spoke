import type from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import loadData from "../../../containers/hoc/load-data";
import { List, ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import NavigationExpandMore from "material-ui/svg-icons/navigation/expand-more";
import NavigationExpandLess from "material-ui/svg-icons/navigation/expand-less";
import theme from "../../../styles/theme";
import { getHighestRole, isRoleGreater } from "../../../lib/permissions";
import ContactReassign from "../../../components/ContactReassign";
import RolesDropdown from "../../../components/PeopleList/RolesDropdown";
import TextField from "material-ui/TextField";
import FlatButton from "material-ui/FlatButton";
import {
  flexStyles,
  inlineStyles
} from "../../../components/AssignmentTexter/StyleControls";
import { css } from "aphrodite";
import TagChip from "../../../components/TagChip";

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
    const tags = {};
    (this.props.campaign.organization.tags || []).forEach(tag => {
      tags[tag.id] = tag.name;
    });

    this.state = {
      expanded: {},
      selectedRole: "",
      showContactReassign: false,
      maxContacts: this.props.assignment.maxContacts,
      tags
    };
  }

  handleListToggle = id => () => {
    const { expanded } = this.state;
    this.setState({ expanded: { ...expanded, [id]: !expanded[id] } });
  };

  handleRoleChange = (texterId, value) => {
    const { mutations, campaign } = this.props;
    mutations.editOrganizationRoles(
      campaign.organization.id,
      campaign.id,
      texterId,
      [value]
    );
  };

  handleReassignChanged = users => (selection, index) => {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = users.find(t => {
        this.setState({ reassignTo: undefined });
        return t.displayName === selection;
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
    const { mutations, campaign, contact } = this.props;
    mutations.reassignCampaignContacts(
      campaign.organization.id,
      [
        {
          campaignId: campaign.id,
          campaignContactId: contact.id,
          messageIds: contact.messages.map(message => message.id)
        }
      ],
      this.state.reassignTo
    );
  };

  handleReassignToggle = () => {
    this.setState({ showContactReassign: !this.state.showContactReassign });
  };

  handleMaxContactsChange = e => {
    this.setState({ maxContacts: e.currentTarget.value });
  };

  handleUpdateMaxContacts = () => {
    const { mutations, campaign, assignment } = this.props;
    mutations.updateAssignmentMaxContacts(
      campaign.organization.id,
      parseInt(this.state.maxContacts, 10),
      assignment.id
    );
  };

  render() {
    const { campaign, contact, texter, currentUser, mutations } = this.props;

    const {
      expanded,
      texterSearchText,
      reassignTo,
      showContactReassign,
      maxContacts
    } = this.state;

    const rightIconButton = id => (
      <IconButton
        style={{ padding: 0, width: 20, height: 20 }}
        iconStyle={{ height: 20, width: 20 }}
        onClick={this.handleListToggle(id)}
      >
        {expanded[id] ? <NavigationExpandLess /> : <NavigationExpandMore />}
      </IconButton>
    );

    const StyledListItem = props => (
      <ListItem {...props} style={{ fontSize: "90%", padding: 4 }} disabled />
    );

    const NestedListItem = props => (
      <StyledListItem
        {...props}
        open={expanded[props.id]}
        rightIconButton={rightIconButton(props.id)}
      />
    );

    const { firstName, lastName, cell, ...otherContactItems } = contact;

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

    const escalatedTags = contact.tags.map(tag => ({
      ...tag,
      name: this.state.tags[tag.id]
    }));

    const sectionStyle = { padding: "12px 0" };
    const headingStyle = { margin: "0 0 6px" };

    return (
      <div>
        <h3>Admin Tools</h3>
        <div style={sectionStyle}>
          <h4 style={headingStyle}>Contact info</h4>
          <List style={{ textAlign: "left", wordWrap: "break-word" }}>
            <StyledListItem primaryText={`Name: ${firstName} ${lastName}`} />
            <StyledListItem primaryText={`Cell: ${cell}`} />
            <NestedListItem
              id="more"
              primaryText="More Info"
              nestedItems={nestItems(otherContactItems)}
            />
          </List>
        </div>
        {isRoleGreater("SUPERVOLUNTEER", getHighestRole(texter.roles)) ? (
          <div style={sectionStyle}>
            <h4 style={headingStyle}>Change Texter Role</h4>
            <RolesDropdown
              roles={texter.roles}
              onChange={this.handleRoleChange}
              style={{ fontSize: theme.text.body.fontSize, width: "100%" }}
              iconStyle={{ fill: theme.colors.gray }}
              autoWidth={false}
              texterId={texter.id}
              currentUser={currentUser}
              highestMenuRole="VETTED_TEXTER"
            />
          </div>
        ) : null}
        <div style={sectionStyle}>
          <a
            style={{
              display: "inline-block",
              textDecoration: "underline",
              cursor: "pointer"
            }}
            onClick={this.handleReassignToggle}
          >
            <h4 style={headingStyle}>Reassign Contact</h4>
          </a>
          {showContactReassign ? (
            <ContactReassign
              onFocus={() =>
                this.setState({
                  reassignTo: undefined,
                  texterSearchText: ""
                })
              }
              texterId={texter.id}
              onUpdateInput={texterSearchText =>
                this.setState({ texterSearchText })
              }
              searchText={texterSearchText}
              onReassignClick={this.handleReassignRequested}
              onNewRequest={this.handleReassignChanged}
              reassignTo={reassignTo}
              organizationId={campaign.organization.id}
            />
          ) : null}
        </div>
        {campaign.useDynamicAssignment ? (
          <div style={sectionStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Update Max Contacts</span>
              <TextField
                style={{ width: 50, fontSize: theme.text.body.fontSize }}
                hintText="Max"
                value={maxContacts}
                onChange={this.handleMaxContactsChange}
              />
            </div>
            <div>
              <FlatButton
                label={"Update"}
                onClick={this.handleUpdateMaxContacts}
                disabled={
                  !this.state.maxContacts ||
                  parseInt(this.state.maxContacts, 10) ===
                    this.props.assignment.maxContacts
                }
                className={css(flexStyles.flatButton)}
                labelStyle={inlineStyles.flatButtonLabel}
              />
            </div>
          </div>
        ) : null}
        {escalatedTags.length > 0 ? (
          <div style={sectionStyle}>
            <h4 style={headingStyle}>Resolve Tags</h4>
            {escalatedTags.map(tag => (
              <TagChip
                text={tag.name}
                backgroundColor={
                  tag.value !== "RESOLVED" ? null : theme.colors.lightGray
                }
                onRequestDelete={
                  tag.value !== "RESOLVED"
                    ? async () => {
                        await mutations.updateTag(
                          contact.id,
                          tag.id,
                          "RESOLVED"
                        );
                      }
                    : null
                }
                deleteIconStyle={{ marginBottom: "4px" }}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

TexterSideboxClass.propTypes = {
  mutations: type.object,
  // data
  contact: type.object,
  campaign: type.object,
  assignment: type.object,
  texter: type.object,
  currentUser: type.object
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
  }),
  updateAssignmentMaxContacts: ownProps => (
    organizationId,
    maxContacts,
    assignmentId
  ) => ({
    mutation: gql`
      mutation updateAssignmentMaxContacts(
        $organizationId: String!
        $maxContacts: Int!
        $assignmentId: String!
      ) {
        updateAssignmentMaxContacts(
          organizationId: $organizationId
          maxContacts: $maxContacts
          assignmentId: $assignmentId
        ) {
          id
          maxContacts
        }
      }
    `,
    variables: { organizationId, maxContacts, assignmentId }
  }),
  updateTag: ownProps => (campaignContactId, id, value) => ({
    mutation: gql`
      mutation updateContactTags(
        $tags: [ContactTagInput]
        $campaignContactId: String!
        $tagId: String!
      ) {
        updateContactTags(tags: $tags, campaignContactId: $campaignContactId) {
          id
          tags(tagId: $tagId) {
            id
            value
            campaignContactId
          }
        }
      }
    `,
    variables: {
      tags: [{ id, value }],
      campaignContactId,
      tagId: id
    }
  })
};

export const TexterSidebox = loadData({ mutations })(
  withRouter(TexterSideboxClass)
);
