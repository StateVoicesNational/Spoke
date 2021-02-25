import PropTypes from "prop-types";
import React from "react";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import muiTheme from "../styles/mui-theme";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  root: {
    ...theme.text.body,
    height: "100%"
  }
});

const App = ({ children }) => (
  <MuiThemeProvider muiTheme={muiTheme}>
    <div className={css(styles.root)}>{children}</div>
  </MuiThemeProvider>
);

App.propTypes = {
  children: PropTypes.object
};

export default App;
