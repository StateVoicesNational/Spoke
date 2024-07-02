import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import withMuiTheme from "./../containers/hoc/withMuiTheme";

import UserEdit from "../containers/UserEdit";

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: "login"
    };

    this.isLocalLogin = window.PASSPORT_STRATEGY === "local";
  }

  styles = StyleSheet.create({
    fieldContainer: {
      padding: "15px",
      width: "256px"
    },
    loginPage: {
      display: "flex",
      "justify-content": "center",
      "align-items": "flex-start",
      height: "100vh",
      "padding-top": "10vh"
    },
    header: {
      ...theme.text.header,
      "text-align": "center",
      "margin-bottom": 0,
      "color": "#0100b6"
    },
    footer: {
      display: "block",
      "text-align": "center",
      "bottom": "0px",
      "font-family": "Poppins"
    }
  });

  componentDidMount = () => {
    const {
      location: {
        query: { nextUrl }
      }
    } = this.props;

    if (!this.isLocalLogin) {
      window.AuthService.login(nextUrl);
      return;
    }

    if (!this.naiveVerifyInviteValid(nextUrl)) {
      this.props.router.replace("/login");
    }
    if (nextUrl && nextUrl.includes("reset")) {
      this.setState({ active: "reset" });
    }
  };

  handleClick = active => {
    this.setState({ active });
  };

  naiveVerifyInviteValid = (nextUrl, maybeSignup) =>
    (/^\/int/.test(nextUrl) && !maybeSignup) || // integration urls
    /^\/sign/.test(nextUrl) || // signup integration urls
    /\/\w{8}-(\w{4}\-){3}\w{12}(\/|$)/.test(nextUrl);

  render() {
    if (!this.isLocalLogin) {
      // Login provider will handle redirecting
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
      <div className={css(this.styles.loginPage)}>
        <div>
          {/* Only display sign up option if there is a nextUrl */}
          {true && ( // displaySignUp
            <ButtonGroup fullWidth>
              <Button
                color="default"
                variant="contained"
                onClick={() => this.handleClick("login")}
                disabled={this.state.active === "login"}
              >
                Log In
              </Button>
              <Button
                color="default"
                variant="contained"
                name="signup"
                onClick={() => this.handleClick("signup")}
                disabled={this.state.active === "signup"}
              >
                Sign Up
              </Button>
            </ButtonGroup>
          )}
          <Paper className={css(this.styles.fieldContainer)}>
            <h2 className={css(this.styles.header)}>Welcome to Dispatch</h2>
            <UserEdit
              authType={this.state.active}
              saveLabel={saveLabels[this.state.active]}
              router={router}
              nextUrl={nextUrl}
              style={css(this.styles.authFields)}
            />
          </Paper>
          <div className={css(this.styles.footer)}>
            <a href="https://www.statevoices.org/privacy-policy/">Privacy Policy</a>
          </div>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  location: PropTypes.object,
  router: PropTypes.object
};

export default withMuiTheme(withRouter(Login));
