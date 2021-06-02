import theme from "./theme";
import { createMuiTheme } from "@material-ui/core/styles";

export default createMuiTheme({
  palette: {
    primary: {
      main: theme.colors.green,
      contrastText: theme.colors.white
    },
    secondary: {
      main: theme.colors.orange,
      contrastText: theme.colors.white
    }
  }
});
