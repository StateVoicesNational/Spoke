import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";

const inlineStyles = {
  icon: {
    width: 180,
    height: 180,
    opacity: 0.2
  }
};

// removing pencil image for mobile widths smaller than 450px

const styles = StyleSheet.create({
  container: {
    marginTop: "10px",
    width: 180,
    marginLeft: "auto",
    marginRight: "auto"
  },
  hideMobile: {
    marginTop: "10px",
    width: 180,
    marginLeft: "auto",
    marginRight: "auto",
    "@media(max-width: 450px)": {
      display: "none"
    }
  },
  title: {
    ...theme.text.header,
    textAlign: "center"
  },
  content: {
    marginTop: "15px",
    textAlign: "center"
  }
});

const Empty = ({ title, icon, content, hideMobile }) => (
  <div
    className={hideMobile ? css(styles.hideMobile) : css(styles.container)}
    {...dataTest("empty")}
  >
    {React.cloneElement(icon, { style: inlineStyles.icon })}
    <div className={css(styles.title)}>{title}</div>
    {content ? <div className={css(styles.content)}>{content}</div> : ""}
  </div>
);

Empty.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.object,
  content: PropTypes.object,
  hideMobile: PropTypes.bool
};

export default Empty;
