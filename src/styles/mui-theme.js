import { createTheme } from "@material-ui/core/styles";

/**
 * This is the default theme to be used in the app
 * when there is no organization theme to show or use
 */
const defaultTheme = {
  palette: {
    type: "light",
    primary: {
      main: "#209556"
    },
    secondary: {
      main: "#555555"
    },
    warning: {
      main: "#fabe28"
    },
    info: {
      main: "#3f80b2"
    }
  }
};

let theme = createTheme(defaultTheme);

export { defaultTheme };

export default theme;
