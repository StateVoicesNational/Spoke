import PropTypes from "prop-types";
import React from "react";
import Navigation from "../components/Navigation";
import { withRouter } from "react-router";
import { dataTest } from "../lib/attributes";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

class AdminNavigation extends React.Component {
  urlFromPath(path) {
    const { organizationId } = this.props;
    return `/admin/${organizationId}/${path}`;
  }

  render() {
    const { organizationId, sections } = this.props;
    return (
      <Navigation
        onToggleMenu={this.props.onToggleMenu}
        showMenu={this.props.showMenu}
        sections={sections.map(section => ({
          ...section,
          url: this.urlFromPath(section.path)
        }))}
        switchListItem={
          <ListItem
            button
            {...dataTest("navSwitchToTexter")}
            onClick={() =>
              this.props.router.push(`/app/${organizationId}/todos`)
            }
          >
            <ListItemText primary="Switch to texter" />
          </ListItem>
        }
      />
    );
  }
}

AdminNavigation.defaultProps = {
  showMenu: true
};

AdminNavigation.propTypes = {
  data: PropTypes.object,
  organizationId: PropTypes.string,
  router: PropTypes.object,
  sections: PropTypes.array,
  params: PropTypes.object,
  onToggleMenu: PropTypes.func.isRequired,
  showMenu: PropTypes.bool
};

export default withRouter(AdminNavigation);
