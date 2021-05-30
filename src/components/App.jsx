import PropTypes from "prop-types";
import React, { useState } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import { defaultTheme } from "../styles/mui-theme";
import ThemeContext from "../containers/context/ThemeContext";

/**
 * We will let users customize the colors but not other
 * parts of the theme object. Here we will take the string,
 * parse it, and merge it with other app theme defaults
 */
const formatThemeString = newPaletteString => {
  const newPalette = JSON.parse(newPaletteString);
  return {
    ...defaultTheme,
    palette: newPalette.palette
  };
};

const App = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const muiTheme = createMuiTheme(theme);
  console.log("APP THEME", theme);
  const handleSetTheme = newPaletteString => {
    if (newPaletteString === undefined) {
      // happpens when OrganizationWrapper unmounts
      setTheme(defaultTheme);
    } else {
      try {
        const newTheme = formatThemeString(newPaletteString);
        setTheme(newTheme);
      } catch (e) {
        console.error("Failed to parse theme: ", newPaletteString);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ muiTheme, setTheme: handleSetTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div styles={{ height: "100%" }}>{children}</div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

App.propTypes = {
  children: PropTypes.object
};

export default App;
