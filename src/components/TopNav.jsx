import PropTypes from "prop-types";
import React from "react";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import Avatar from "@material-ui/core/Avatar";
import { Link } from "react-router";
import UserMenu from "../containers/UserMenu";

const useStyles = makeStyles(() => ({
  toolBar: {
    flexGrow: 1
  },
  title: {
    flexGrow: 1
  }
}));

function BackButton({ url }) {
  return (
    <Link to={url}>
      <IconButton>
        <ArrowBackIcon style={{ fill: "white" }} />
      </IconButton>
    </Link>
  );
}

function TopNav(props) {
  const classes = useStyles();
  const { backToURL, orgId, title } = props;
  return (
    <AppBar position="static">
      <Toolbar className={classes.toolBar}>
        {backToURL && <BackButton url={backToURL} />}
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
        <UserMenu orgId={orgId} />
      </Toolbar>
    </AppBar>
  );
}

TopNav.propTypes = {
  backToURL: PropTypes.string,
  title: PropTypes.string.isRequired,
  orgId: PropTypes.string
};

export default TopNav;
