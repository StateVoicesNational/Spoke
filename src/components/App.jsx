import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { ThemeProvider , createTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { defaultTheme } from "../styles/mui-theme";
import ThemeContext from "../containers/context/ThemeContext";
import { gql } from "@apollo/client";
import { withRouter } from "react-router";
import loadData from "../containers/hoc/load-data";

function App({children, data}) {
  const dark = data?.currentUser?.dark
  const [theme, setTheme] = useState(defaultTheme);
  const defaultThemeWithMode = {
    ...defaultTheme,
    palette: { ...defaultTheme.palette, "type": dark ? "dark" : "light" }
  };


  let muiTheme = createTheme(defaultThemeWithMode);
  try {
    // if a bad value is saved this will fail.
    muiTheme = createTheme(theme);
  } catch (e) {
    console.error("failed to create theme", theme);
  }

  /**
 * We will let users customize the colors but not other
 * parts of the theme object. Here we will take the string,
 * parse it, and merge it with other app theme defaults
 */
const formatTheme = (newTheme) => {
  return {
    ...defaultTheme,
    palette: {
      ...newTheme.palette,
      "type": dark ? "dark" : "light"
    }
  };
};

  const handleSetTheme = useCallback((newPalette) => {
    if (newPalette === undefined) {
      // happens when OrganizationWrapper unmounts
      setTheme(defaultThemeWithMode);
    } else {
      try {
        setTheme(formatTheme(newPalette));
      } catch (e) {
        console.error("Failed to parse theme: ", newPalette);
      }
    }
  },[defaultThemeWithMode])


  return (
    <ThemeContext.Provider value={{ muiTheme, setTheme: handleSetTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ height: "100%" }}>{children}</div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

App.propTypes = {
  children: PropTypes.object,
  data: PropTypes.object
};


const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          dark
        }
     }`
  }
}

const EnhancedApp = withRouter(
  loadData({queries})(App)
)
export default EnhancedApp;

