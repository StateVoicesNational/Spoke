import { createMuiTheme } from "@material-ui/core/styles";

/**
 * This is the default theme to be used in the app
 * when there is no organization theme to show or use
 */
const defaultTheme = {
  palette: {
    type: "light",
    primary: {
      main: "#0100b6"
    },
    secondary: {
      main: "#555555"
    },
    warning: {
      main: "#fabe28"
    },
    info: {
      main: "#FA3C01"
    }
  }
};

let theme = createMuiTheme(defaultTheme);

export { defaultTheme };

export default theme;
