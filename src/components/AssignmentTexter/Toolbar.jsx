import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import HomeIcon from "@material-ui/icons/Home";
import BuildIcon from "@material-ui/icons/Build";

const inlineStyles = {
  toolbar: {
    backgroundColor: "rgb(81, 82, 89)",
    color: "white",
    padding: 0,
    minHeight: "inherit"
  }
};

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1
  },
  topFlex: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "column",
    alignContent: "flex-start"
    // marginLeft: "-24px"
  },
  campaignData: {
    flex: "1 2 auto",
    maxWidth: "80%",
    "@media(max-width: 375px)": {
      maxWidth: "70%" // iphone 5 and X
    }
  },
  contactData: {
    flex: "1 2 auto",
    maxWidth: "80%",
    "@media(max-width: 375px)": {
      maxWidth: "50%" // iphone 5 and X
    }
  },
  titleArea: {
    // give room for the wrench sideboxes icon
    maxWidth: "calc(100% - 100px)"
  },
  contactArea: {
    // give room for prev/next arrows
    maxWidth: "calc(100% - 200px)"
  },
  titleSmall: {
    height: "18px",
    lineHeight: "18px",
    paddingTop: "4px",
    paddingRight: "10px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "95%"
  },
  titleBig: {
    height: "34px",
    lineHeight: "34px",
    paddingRight: "10px",
    fontWeight: "bold",
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  contactToolbarIconButton: {
    padding: "3px",
    height: "56px",
    "@media(max-width: 350px)": {
      width: "50px"
    }
  },
  navigationSideBox: {
    flexBasis: "24px",
    // width also in Controls.jsx::getSideboxDialogOpen
    "@media(min-width: 575px)": {
      display: "none"
    }
  },
  navigation: {
    flexGrow: 0,
    flexShrink: 0,
    display: "flex"
    // flexDirection: "column",
    // flexWrap: "wrap"
  },
  navigationTitle: {
    width: "4em",
    // height: "100%",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
});

const CampaignToolbar = props => (
  <Toolbar style={inlineStyles.toolbar}>
    <Tooltip title="Return Home">
      <IconButton
        onClick={props.onExit}
        className={css(styles.contactToolbarIconButton)}
      >
        <HomeIcon style={{ width: 42 }} htmlColor="white" />
      </IconButton>
    </Tooltip>
    <div className={css(styles.titleArea)}>
      <div className={css(styles.titleSmall)} style={{ color: "#B0B0B0" }}>
        Campaign ID: {props.campaign.id}
      </div>
      <div className={css(styles.titleBig)} title={props.campaign.title}>
        {props.campaign.title}
      </div>
    </div>
    {props.onSideboxButtonClick && (
      <React.Fragment>
        <div className={css(styles.grow)}></div>
        <div
          className={`${css(styles.navigation)} ${css(
            styles.navigationSideBox
          )}`}
        >
          <Tooltip title="Open Details">
            <IconButton
              onClick={props.onSideboxButtonClick}
              className={css(styles.contactToolbarIconButton)}
              style={{ flex: "0 0 56px", width: "45px" }}
            >
              <BuildIcon htmlColor="white" />
            </IconButton>
          </Tooltip>
        </div>
      </React.Fragment>
    )}
  </Toolbar>
);

CampaignToolbar.propTypes = {
  campaign: PropTypes.object,
  onSideboxButtonClick: PropTypes.func,
  onExit: PropTypes.func
};

export default CampaignToolbar;
