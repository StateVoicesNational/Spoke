import PropTypes from "prop-types";
import React, { useState } from "react";
import { ThemeProvider, createTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import { defaultTheme } from "../styles/mui-theme";
import ThemeContext from "../containers/context/ThemeContext";
import { gql } from "@apollo/client";
import loadData from "../containers/hoc/load-data";

/**
 * We will let users customize the colors but not other
 * parts of the theme object. Here we will take the string,
 * parse it, and merge it with other app theme defaults
 */
const formatTheme = (newTheme, darkMode) => {
  return {
    ...defaultTheme,
    palette: {...newTheme.palette,
      type: darkMode ? "dark" : "light"}
  };
};

const App = ({ children, user }) => {
  const darkMode = user?.currentUser?.darkMode;
  const defaultThemeWithMode = {
    ...defaultTheme,
    palette: { ...defaultTheme.palette, "type": darkMode ? "dark" : "light" }
  };

  const [theme, setTheme] = useState(defaultThemeWithMode);
  let muiTheme = createTheme(defaultThemeWithMode);
  try {
    // if a bad value is saved this will fail.
    muiTheme = createTheme(theme);
  } catch (e) {
    console.error("failed to create theme", theme);
  }
  const handleSetTheme = newPalette => {
    if (newPalette === undefined) {
      // happens when OrganizationWrapper unmounts
      setTheme(defaultThemeWithMode);
    } else {
      try {
        const newTheme = formatTheme(newPalette, darkMode);
        setTheme(newTheme);
      } catch (e) {
        console.error("Failed to parse theme: ", newPalette);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ muiTheme, setTheme: handleSetTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ height: "100%" }}>{children}</div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

App.propTypes = {
  children: PropTypes.object
};

const queries = {
  user: {
    query: gql`
      query getCurrentUser {
        currentUser {
          darkMode
        }
     }`
  },
}
export const operations = { queries };

export default loadData(operations)(App);
