import { createMuiTheme } from "@material-ui/core/styles";

const defaultTheme = {
  palette: {
    type: "light",
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
