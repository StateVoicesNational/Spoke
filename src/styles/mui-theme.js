import { createMuiTheme } from "@material-ui/core/styles";

/**
 * This is the default theme to be used in the app
 * when there is no organization theme to show or use
 */
const defaultTheme = {
  palette: {
    type: "dark",
    primary: {
      main: "#53b477",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#ffffff"
    }
  }
};

let theme = createMuiTheme(defaultTheme);

export { defaultTheme };

export default theme;
