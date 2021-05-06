import PropTypes from "prop-types";
import React from "react";
import muiTheme from "../styles/mui-theme";
import { ThemeProvider } from "@material-ui/core/styles";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  root: {
    ...theme.text.body,
    height: "100%"
  }
});

const App = ({ children }) => (
  <ThemeProvider theme={muiTheme}>
    <div className={css(styles.root)}>{children}</div>
  </ThemeProvider>
);

App.propTypes = {
  children: PropTypes.object
};

export default App;
