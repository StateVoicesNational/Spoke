const defaultFont = "Poppins";

const text = {
  body: {
    fontSize: 14,
    fontFamily: defaultFont
  },
  link_light_bg: {
    fontWeight: 400,
    textDecoration: "none",
    borderBottom: "1px solid",
    cursor: "pointer",
    ":hover": {
      borderBottom: 0
    },
    "a:visited": {
      fontWeight: 400,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  link_dark_bg: {
    fontWeight: 400,
    textDecoration: "none",
    borderBottom: `1px solid`,
    cursor: "pointer",
    ":hover": {
      borderBottom: 0
    },
    "a:visited": {
      fontWeight: 400,
      textDecoration: "none"
    },
    fontFamily: defaultFont
  },
  header: {
    fontSize: "1.5em",
    fontWeight: 600,
    fontFamily: defaultFont
  },
  secondaryHeader: {
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
    textAlign: "center"
  },
  buttons: {
    display: "flex",
    justifyContent: "space-evenly",
    marginTop: 20
  }
};

const components = {
  buyPhoneNumberButton: {
    margin: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "inherit"
  },
  checkShortCodesButton: {
    marginLeft: 0,
    top: "auto",
    right: 20,
    bottom: 20,
    left: "auto",
    position: "inherit"
  },
  logoDiv: {
    margin: "50 auto",
    overflow: "hidden"
  },
  logoImg: {},
  popup: {}
};

const theme = {
  text,
  layouts,
  components
};

export default theme;
