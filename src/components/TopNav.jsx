import PropTypes from "prop-types";
import React from "react";
import { compose } from "recompose";

import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import { Link as RouterLink } from "react-router";
import UserMenu from "../containers/UserMenu";
import withMuiTheme from "./../containers/hoc/withMuiTheme";

const useStyles = makeStyles(() => ({
  toolBar: {
    flexGrow: 1
  },
  title: {
    flexGrow: 1
  }
}));

export function TopNavBase(props) {
  const classes = useStyles();

  const { backToURL, orgId, title, muiTheme } = props;
  return (
    <AppBar position="static">
      <Toolbar className={classes.toolBar}>
        {backToURL && (
          <RouterLink to={backToURL}>
            <IconButton>
              <ArrowBackIcon
                style={{ fill: muiTheme.palette.primary.contrastText }}
              />
            </IconButton>
          </RouterLink>
        )}
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
        <UserMenu orgId={orgId} />
      </Toolbar>
    </AppBar>
  );
}

TopNavBase.propTypes = {
  backToURL: PropTypes.string,
  title: PropTypes.string.isRequired,
  orgId: PropTypes.string
};

export default withMuiTheme(TopNavBase);
