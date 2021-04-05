import PropTypes from "prop-types";
import React from "react";
import Paper from "material-ui/Paper";
import { List, ListItem } from "material-ui/List";
import Divider from "material-ui/Divider";
import { withRouter } from "react-router";
import _ from "lodash";
import { dataTest, camelCase } from "../lib/attributes";
import MenuIcon from "material-ui/svg-icons/navigation/menu";
import CloseIcon from "material-ui/svg-icons/navigation/close";
import IconButton from "material-ui/IconButton/IconButton";

import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  sideBarWithMenu: {
    width: 256,
    height: "100%"
  },
  sideBarWithoutMenu: {
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
          rounded={false}
          zDepth={2}
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
                key={section.name}
                primaryText={section.name}
                onTouchTap={() => props.router.push(section.url)}
              />
            ))}
            <Divider />
            {switchListItem}
          </List>
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
