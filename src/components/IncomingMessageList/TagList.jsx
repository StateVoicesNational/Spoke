import React from "react";
import { StyleSheet, css } from "aphrodite";
import PropTypes from "prop-types";
// import { compose } from "recompose";

import Avatar from "@material-ui/core/Avatar";
import FlagIcon from "@material-ui/icons/Flag";

import withMuiTheme from "../../containers/hoc/withMuiTheme";

const styles = StyleSheet.create({
  conversationRow: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  }
});

const TagList = props => (
  <div style={{ maxHeight: "300px", overflowY: "scroll" }}>
    {props.tags.map((tag, index) => {
      const tagStyle = {
        marginRight: "60px",
        backgroundColor: this.props.muiTheme.palette.error.main,
        display: "flex",
        maxHeight: "25px",
        alignItems: "center"
      };

      const textStyle = {
        marginLeft: "10px",
        display: "flex",
        flexDirection: "column"
      };

      return (
        <p key={index} className={css(styles.conversationRow)} style={tagStyle}>
          <Avatar
            style={{ backgroundColor: this.props.muiTheme.palette.error.main }}
          >
            <FlagIcon color="default" />
          </Avatar>
          <p style={textStyle}>{props.organizationTags[tag.id]}</p>
        </p>
      );
    })}
  </div>
);

TagList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.object),
  organizationTags: PropTypes.object
};

export default withMuiTheme(TagList);
