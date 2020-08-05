import PropTypes from "prop-types";
import React from "react";
import TopNav from "../components/TopNav";
import { withRouter } from "react-router";
import ContentAdd from "material-ui/svg-icons/content/add";
import FloatingActionButton from "material-ui/FloatingActionButton";

import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  fieldContainer: {
    background: theme.colors.white,
    padding: "15px",
    width: "256px"
  },
  loginPage: {
    display: "flex",
    "justify-content": "center",
    "align-items": "flex-start",
    height: "100vh",
    "padding-top": "10vh",
    background: theme.colors.veryLightGray
  },
  button: {
    border: "none",
    background: theme.colors.lightGray,
    color: theme.colors.darkGreen,
    padding: "16px 16px",
    "font-size": "14px",
    "text-transform": "uppercase",
    cursor: "pointer",
    width: "50%",
    transition: "all 0.3s",
    ":disabled": {
      background: theme.colors.white,
      cursor: "default",
      color: theme.colors.green
    }
  },
  header: {
    ...theme.text.header,
    color: theme.colors.coreBackgroundColor,
    "text-align": "center",
    "margin-bottom": 0
  }
});

class AdminOrganizationsDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: "login"
    };

    this.isLocalAdminOrganizationsDashboard = window.PASSPORT_STRATEGY === "local";
  }

  componentDidMount = () => {
    const {
      location: {
        query: { nextUrl }
      }
    } = this.props;

    if (!this.isLocalAdminOrganizationsDashboard) {
      window.AuthService.login(nextUrl);
      return;
    }

    if (nextUrl && nextUrl.includes("reset")) {
      this.setState({ active: "reset" });
    }
  };

  handleClick = e => {
    this.setState({ active: e.target.name });
  };

  naiveVerifyInviteValid = (nextUrl, maybeSignup) =>
    (/^\/int/.test(nextUrl) && !maybeSignup) || // integration urls
    /^\/sign/.test(nextUrl) || // signup integration urls
    /\/\w{8}-(\w{4}\-){3}\w{12}(\/|$)/.test(nextUrl);

  renderActionButton() {
    return (
      <FloatingActionButton
        style={theme.components.floatingButton}
        onTouchTap={() => {}}
      >
        <ContentAdd />
      </FloatingActionButton>
    );
  }

  render() {
    if (!this.isLocalAdminOrganizationsDashboard) {
      // AdminOrganizationsDashboard provider will handle redirecting
      return null;
    }

    const {
      location: {
        query: { nextUrl }
      },
      router
    } = this.props;

    // If nextUrl is a valid (naive RegEx only) invite or organization
    // UUID display Sign Up section. Full validation done on backend.
    const inviteLink =
      nextUrl && (nextUrl.includes("join") || nextUrl.includes("invite"));
    let displaySignUp;
    if (inviteLink) {
      displaySignUp = this.naiveVerifyInviteValid(nextUrl, true);
    }

    const saveLabels = {
      login: "Log In",
      signup: "Sign Up",
      reset: "Save New Password"
    };

    return (
      <div>
        <TopNav
          title={"Manage Organizations"}
        />
        <div className={css(styles.loginPage)}>
        <div>
          Hello
        </div>
        </div>
      {this.renderActionButton()}
      </div>
      
    );
  }
}

AdminOrganizationsDashboard.propTypes = {
  location: PropTypes.object,
  router: PropTypes.object
};

export default withRouter(AdminOrganizationsDashboard);
