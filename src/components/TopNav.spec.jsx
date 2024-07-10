// import {
//   muiTheme
// } from "../../__test__/test_helpers";
import ThemeContext from "../../src/containers/context/ThemeContext";
import TopNav from './TopNav'

const muiTheme = {
  palette: {
    type: "light",
    background: { paper: "#fff", default: "#fafafa" },
    common: { black: "#000", white: "#fff" },
    error: {
      main: "#f44336",
      light: "rgb(246, 104, 94)",
      dark: "rgb(170, 46, 37)",
      contrastText: "#fff"
    },
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
      A100: "#d5d5d5",
      A200: "#aaaaaa",
      A400: "#303030",
      A700: "#616161"
    },
    info: {
      main: "#3f80b2",
      light: "rgb(101, 153, 193)",
      dark: "rgb(44, 89, 124)",
      contrastText: "#fff"
    },
    primary: {
      main: "#209556",
      light: "rgb(76, 170, 119)",
      dark: "rgb(22, 104, 60)",
      contrastText: "#fff"
    },
    secondary: {
      main: "#555555",
      light: "rgb(119, 119, 119)",
      dark: "rgb(59, 59, 59)",
      contrastText: "#fff"
    },
    success: {
      main: "#4caf50",
      light: "rgb(111, 191, 115)",
      dark: "rgb(53, 122, 56)",
      contrastText: "rgba(0, 0, 0, 0.87)"
    },
    text: {
      primary: "rgba(0, 0, 0, 0.87)",
      secondary: "rgba(0, 0, 0, 0.54)",
      disabled: "rgba(0, 0, 0, 0.38)",
      hint: "rgba(0, 0, 0, 0.38)"
    },
    warning: {
      main: "#fabe28",
      light: "rgb(251, 203, 83)",
      dark: "rgb(175, 133, 28)",
      contrastText: "rgba(0, 0, 0, 0.87)"
    },
    getContrastText: () => "getContrastText",
    action: {
      hover: "#333333"
    }
  }
};



describe('TopNav', () => {
  it('test', () => {
    cy.mount(<div>hello</div>)
  })
  it("Renders UserMenu with orgId", () => {
    const orgId = "1";
    const title = "foo";
    cy.mount(
      <ThemeContext.Provider value={{ muiTheme }}>
        <TopNav orgId={orgId} title={title} />
      </ThemeContext.Provider>
    );
  });
})