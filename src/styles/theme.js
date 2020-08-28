import tinycolor from "tinycolor2";

const coreBackgroundColor = global.CORE_BACKGROUND_COLOR || "rgb(83, 180, 119)";

const colors = {
  coreBackgroundColor: coreBackgroundColor,
  coreBackgroundColorDisabled: tinycolor(coreBackgroundColor)
    .darken(10)
    .toHexString(),
  coreHoverColor: tinycolor(coreBackgroundColor)
    .darken(5)
    .toHexString(),
  orange: "rgb(255, 102, 0)",
  lightGreen: "rgb(245, 255, 247)",
  blue: "rgb(20, 127, 215)",
  purple: "#5f2787",
  lightBlue: "rgb(196, 223, 245)",
  darkBlue: "rgb(13, 81, 139)",
  red: "rgb(245, 91, 91)",
  lightRed: "rgb(255, 141, 141)",
  darkRed: "rgb(237, 60, 57)",
  green: "rgb(83, 180, 119)",
  darkGreen: "rgb(24, 154, 52)",
  darkGray: "rgb(54, 67, 80)",
  gray: "rgb(153, 155, 158)",
  gray50: "rgb(250, 250, 250)",
  veryLightGray: "rgb(240, 242, 240)",
  lightGray: "rgb(225, 228, 224)",
  white: "rgb(255,255,255)",
  yellow: "rgb(250,190,40)",
  lightYellow: "rgb(252, 214, 120)"
};

const defaultFont = "Poppins";

const text = {
  body: {
    color: colors.darkGray,
    fontSize: 14,
    fontFamily: defaultFont
  },
  link_light_bg: {
    fontWeight: 400,
    color: colors.green,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.green}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.orange
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.darkGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  link_dark_bg: {
    fontWeight: 400,
    color: colors.white,
    textDecoration: "none",
    borderBottom: `1px solid ${colors.white}`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0,
      color: colors.orange
    },
    "a:visited": {
      fontWeight: 400,
      color: colors.veryLightGray,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  header: {
    color: colors.darkGray,
    fontSize: "1.5em",
    fontWeight: 600,
    fontFamily: defaultFont
  },
  secondaryHeader: {
    color: colors.darkGray,
    fontSize: "1.25em",
    fontFamily: defaultFont
  }
};

const layouts = {
  multiColumn: {
    container: {
      display: "flex",
      flexDirection: "row"
    },
    flexColumn: {
      display: "flex",
      flex: 1,
      flexDirection: "column"
    }
  },
  greenBox: {
    marginTop: "5vh",
    maxWidth: "80%",
    paddingBottom: "7vh",
    borderRadius: 8,
    paddingTop: "7vh",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "center",
    backgroundColor: colors.coreBackgroundColor,
    color: colors.white
  }
};

const components = {
  floatingButton: {
    margin: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "fixed"
  },
  logoDiv: {
    margin: "50 auto",
    overflow: "hidden"
  },
  logoImg: {},
  popup: {
    backgroundColor: colors.gray50,
    outline: colors.darkGray
  }
};

const theme = {
  colors,
  text,
  layouts,
  components
};

export default theme;
