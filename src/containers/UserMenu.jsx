import PropTypes from "prop-types";
import React, { Component } from "react";
import Popover from "material-ui/Popover";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Divider from "@material-ui/core/Divider";
import Subheader from "material-ui/Subheader";
import { graphql } from "react-apollo";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";

import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";

export class UserMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      anchorEl: null
    };
    this.handleReturn = this.handleReturn.bind(this);
    this.handleRequestFaqs = this.handleRequestFaqs.bind(this);
  }

  handleTouchTap = event => {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      open: true,
      anchorEl: event.currentTarget
    });
  };

  handleRequestClose = () => {
    this.setState({
      open: false
    });
  };

  handleMenuChange = (event, value) => {
    this.handleRequestClose();
    const { currentUser } = this.props.data;
    if (value === "logout") {
      window.AuthService.logout();
    } else if (value === "account") {
      const { orgId } = this.props;
      if (orgId) {
        this.props.router.push(`/app/${orgId}/account/${currentUser.id}`);
      }
    } else {
      if (currentUser.superVolOrganizations.some(org => org.id === value)) {
        this.props.router.push(`/admin/${value}`);
      } else {
        this.props.router.push(`/app/${value}/todos`);
      }
    }
  };

  handleReturn = e => {
    e.preventDefault();
    const { orgId } = this.props;
    this.props.router.push(`/app/${orgId}/todos`);
  };

  handleRequestFaqs = e => {
    e.preventDefault();
    const { orgId } = this.props;
    this.props.router.push(`/app/${orgId}/faqs`);
  };

  handleAdminOrganizations = e => {
    e.preventDefault();
    this.props.router.push(`/organizations`);
  };

  renderAvatar(user, size) {
    const inlineStyles = {
      textAlign: "center",
      color: "white",
      padding: 5,
      height: size,
      width: size
    };
    return <Avatar style={inlineStyles}>{user.displayName.charAt(0)}</Avatar>;
  }

  renderAdminTools() {
    return (
      <div>
        <Subheader>Superadmin Tools</Subheader>
        <MenuItem
          primaryText="Manage Organizations"
          value={"adminOrganizations"}
          onClick={this.handleAdminOrganizations}
        />
        <Divider />
      </div>
    );
  }

  render() {
    const { currentUser } = this.props.data;
    if (!currentUser) {
      return <div />;
    }
    const organizations = currentUser.texterOrganizations;
    const isSuperAdmin = currentUser.is_superadmin;
    return (
      <div>
        <IconButton
          {...dataTest("userMenuButton")}
          onClick={this.handleTouchTap}
          // style={{ fonSize: 10 }}
        >
          {this.renderAvatar(currentUser, 20)}
        </IconButton>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          targetOrigin={{ horizontal: "left", vertical: "top" }}
          onRequestClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange}>
            <MenuItem
              {...dataTest("userMenuDisplayName")}
              primaryText={currentUser.displayName}
              leftIcon={this.renderAvatar(currentUser, 20)}
              disabled={!this.props.orgId}
              value={"account"}
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
            {isSuperAdmin ? this.renderAdminTools() : <div />}
            <Subheader>Teams</Subheader>
            {organizations.map(organization => (
              <MenuItem
                key={organization.id}
                primaryText={organization.name}
                value={organization.id}
              />
            ))}
            <Divider />
            <MenuItem
              {...dataTest("home")}
              primaryText="Home"
              onClick={this.handleReturn}
            />
            <MenuItem
              {...dataTest("FAQs")}
              primaryText="FAQs"
              onClick={this.handleRequestFaqs}
            />
            <Divider />
            <MenuItem
              {...dataTest("userMenuLogOut")}
              primaryText="Log out"
              value="logout"
            />
          </Menu>
        </Popover>
      </div>
    );
  }
}

UserMenu.propTypes = {
  data: PropTypes.object,
  orgId: PropTypes.string,
  router: PropTypes.object
};

export default graphql(
  gql`
    query getCurrentUserForMenu {
      currentUser {
        id
        displayName
        email
        is_superadmin
        superVolOrganizations: organizations(role: "SUPERVOLUNTEER") {
          id
          name
        }
        texterOrganizations: organizations(role: "TEXTER") {
          id
          name
        }
      }
    }
  `,
  {
    options: {
      fetchPolicy: "network-only"
    }
  }
)(withRouter(UserMenu));
