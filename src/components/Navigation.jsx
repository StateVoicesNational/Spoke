import PropTypes from "prop-types";
import React from "react";

import Paper from "@material-ui/core/Paper";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";

import { withRouter } from "react-router";
import _ from "lodash";
import { dataTest, camelCase } from "../lib/attributes";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  sideBarWithMenu: {
    width: 256,
    height: "100%",
    writingMode: "hoizontal-lr"
  },
  sideBarWithoutMenu: {
    writingMode: "vertical-rl",
    padding: "5px",
    paddingTop: "20px"
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
            <Button onClick={props.onToggleMenu}>Close Menu</Button>
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
        </Paper>
      </div>
    );
  } else {
    return (
      <div
        className={css(styles.sideBarWithoutMenu)}
        onClick={props.onToggleMenu}
      >
        <span style={{ cursor: "pointer" }}>SHOW MENU</span>
      </div>
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
