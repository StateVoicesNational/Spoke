import theme from "./theme";
import { createTheme } from "@material-ui/core/styles";

export default createTheme({
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
