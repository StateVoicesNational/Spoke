import PropTypes from "prop-types";
import React, { Component } from "react";
import Popover from "material-ui/Popover";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import Subheader from "material-ui/Subheader";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import { graphql } from "react-apollo";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";

const avatarSize = 28;

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

  renderAvatar(user, size) {
    // Material-UI seems to not be handling this correctly when doing serverside rendering
    const inlineStyles = {
      lineHeight: "1.25",
      textAlign: "center",
      color: "white",
      padding: "5px"
    };
    return (
      <Avatar style={inlineStyles} size={size}>
        {user.displayName.charAt(0)}
      </Avatar>
    );
  }

  render() {
    const { currentUser } = this.props.data;
    if (!currentUser) {
      return <div />;
    }
    const organizations = currentUser.texterOrganizations;

    return (
      <div>
        <IconButton
          {...dataTest("userMenuButton")}
          onTouchTap={this.handleTouchTap}
          iconStyle={{ fontSize: "18px" }}
        >
          {this.renderAvatar(currentUser, avatarSize)}
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
              leftIcon={this.renderAvatar(currentUser, 40)}
              disabled={!this.props.orgId}
              value={"account"}
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
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
