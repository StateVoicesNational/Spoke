import PropTypes from "prop-types";
import React, { useCallback, useEffect, useState } from "react";
import { ThemeProvider , createTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Sun from "@material-ui/icons/Flare";
import Moon from "@material-ui/icons/NightsStay";

import Switch from "@material-ui/core/Switch";
import { defaultTheme } from "../styles/mui-theme";
import ThemeContext from "../containers/context/ThemeContext";

function App({ children }) {
  const [darkMode, setDarkMode] = React.useState(false);
  const [theme, setTheme] = useState(defaultTheme);

  const defaultThemeWithMode = {
    ...defaultTheme,
    palette: { ...defaultTheme.palette, "type": darkMode ? "dark" : "light" }
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
      "type": darkMode ? "dark" : "light"
    }
  };
};

  const handleToggleDark = () => setDarkMode(!darkMode);
  useEffect(() => {
    setTheme(formatTheme(theme));
  }, [darkMode]);

  const handleSetTheme = useCallback((newPalette) => {
    if (newPalette === undefined) {
      // happpens when OrganizationWrapper unmounts
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
        <div style={{ float: "right", marginRight: '1.5rem' }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Sun />
            <Switch checked={darkMode} onChange={handleToggleDark} name="darkToggle" />
            <Moon />
          </div>
        </div>
        <div style={{ height: "100%" }}>{children}</div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

App.propTypes = {
  children: PropTypes.object
};

export default App;
