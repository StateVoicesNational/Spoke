import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { createTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import { defaultTheme } from "../styles/mui-theme";
import ThemeContext from "../containers/context/ThemeContext";

/**
 * We will let users customize the colors but not other
 * parts of the theme object. Here we will take the string,
 * parse it, and merge it with other app theme defaults
 */
const formatTheme = (newTheme, darkMode) => {
  console.log('nt', newTheme, darkMode);
  return {
    ...defaultTheme,
    palette: {...defaultTheme.palette,
      ...newTheme.palette,
    'type': darkMode ? 'dark': 'light'}
  };
};

const App = ({ children }) => {
  const [darkMode, setDarkMode] = React.useState(false);
  const [theme, setTheme] = useState(defaultTheme);

 let defaultThemeWithMode = {...defaultTheme,
    palette: {...defaultTheme.palette, 'type': darkMode ? 'dark': 'light'}};


  let muiTheme = createTheme(defaultThemeWithMode);
  try {
    // if a bad value is saved this will fail.
    muiTheme = createTheme(theme);
  } catch (e) {
    console.error("failed to create theme", theme);
  }
  const handleToggleDark = () => {
    setDarkMode(!darkMode)
  }
  const handleSetTheme = newPalette => {
    if (newPalette === undefined) {
      // happpens when OrganizationWrapper unmounts
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

  useEffect(()=>{
    const newTheme = formatTheme(theme, darkMode);
    console.log('dark effect', darkMode)
    setTheme(newTheme)

  }, [darkMode])
  return (
    <ThemeContext.Provider value={{ muiTheme, setTheme: handleSetTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <button onClick={handleToggleDark}>toggle dark</button>
        <div styles={{ height: "100%" }}>{children}</div>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

App.propTypes = {
  children: PropTypes.object
};

export default App;
