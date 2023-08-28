import PropTypes from "prop-types";
import React from "react";

import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";

import { withRouter } from "react-router";
import _ from "lodash";
import { dataTest, camelCase } from "../lib/attributes";
import { StyleSheet, css } from "aphrodite";
import Logo from "../assets/logo"

const styles = StyleSheet.create({
  sideBarWithMenu: {
    width: 256,
    height: "100%"
  },
  sideBarWithoutMenu: {
    padding: "5px",
    paddingTop: "20px"
  },
  logoAndPrivacyLink : {
    display: "block",
    position: "absolute",
    width: "120px",
    margin: "auto",
    bottom: "5%",
    left: "68px"
  },
  privacyPoloicy: {
    position: "absolute",
    margin: "atuo",
    bottom: "3%",
    left: "83px"
  }
});

const Navigation = function Navigation(props) {
  const { sections, switchListItem } = props;

  if (props.showMenu) {
    return (
      <div className={css(styles.sideBarWithMenu)}>
        <Paper
          elevation={3}
          style={{
            height: "100%"
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={props.onToggleMenu}>
              <CloseIcon />
            </IconButton>
          </div>

          <List>
            {sections.map(section => (
              <ListItem
                {...dataTest(_.camelCase(`nav ${section.path}`))}
                button
                key={section.name}
                onClick={() => props.router.push(section.url)}
              >
                <ListItemText primary={section.name} />
              </ListItem>
            ))}
            <Divider />
            {switchListItem}
          </List>
          <div>
              <img src={Logo} className={css(styles.logoAndPrivacyLink)}/>
              <a className={css(styles.privacyPoloicy)} href="https://www.statevoices.org/privacy-policy/">Privacy Policy</a>
          </div>
        </Paper>
      </div>
    );
  } else {
    return (
      <IconButton onClick={props.onToggleMenu}>
        <MenuIcon />
      </IconButton>
    );
  }
};

Navigation.defaultProps = {
  showMenu: true
};

Navigation.propTypes = {
  sections: PropTypes.array,
  switchListItem: PropTypes.object,
  router: PropTypes.object,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
};

export default withRouter(Navigation);
