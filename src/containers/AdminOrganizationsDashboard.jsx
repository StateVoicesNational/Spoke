import PropTypes from "prop-types";
import React from "react";
import TopNav from "../components/TopNav";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import ContentAdd from "material-ui/svg-icons/content/add";
import DataTables from "material-ui-datatables";
import FloatingActionButton from "material-ui/FloatingActionButton";

import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  fieldContainer: {
    background: theme.colors.white,
    padding: "15px",
    width: "256px"
  },
  loginPage: {
    display: "flex",
    "justify-content": "center",
    "align-items": "flex-start",
    height: "100vh",
    "padding-top": "10vh",
    background: theme.colors.veryLightGray
  },
  button: {
    border: "none",
    background: theme.colors.lightGray,
    color: theme.colors.darkGreen,
    padding: "16px 16px",
    "font-size": "14px",
    "text-transform": "uppercase",
    cursor: "pointer",
    width: "50%",
    transition: "all 0.3s",
    ":disabled": {
      background: theme.colors.white,
      cursor: "default",
      color: theme.colors.green
    }
  },
  header: {
    ...theme.text.header,
    color: theme.colors.coreBackgroundColor,
    "text-align": "center",
    "margin-bottom": 0
  }
});

class AdminOrganizationsDashboard extends React.Component {
  renderActionButton() {
    return (
      <FloatingActionButton
        style={theme.components.floatingButton}
        onTouchTap={() => {}}
      >
        <ContentAdd />
      </FloatingActionButton>
    );
  }

  render() {
    console.log(this.props.data);
    var columns = [
      {
        key: "id",
        label: "id",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      {
        key: "name",
        label: "name",
        sortable: true,
        style: {
          width: "5em"
        }
      },
      // note that 'active' is defined as 'not archived'.
      // campaigns that have not yet started are included here.
      // is this what we want?
      {
        key: "campaignsCount",
        label: "Number of Active Campaigns",
        sortable: true,
        style: {
          width: "5em"
        }
      }
    ];

    return (
      <div>
        <TopNav title={"Manage Organizations"} />
        <div className={css(styles.loginPage)}>
          <div>
            <DataTables
              key={"adminOrganizations"}
              data={this.props.data.organizations}
              columns={columns}
            />
          </div>
        </div>
        {this.renderActionButton()}
      </div>
    );
  }
}

AdminOrganizationsDashboard.propTypes = {
  location: PropTypes.object,
  data: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getOrganizations {
        organizations {
          id
          name
          campaignsCount
        }
      }
    `,
    options: ownProps => ({
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(withRouter(AdminOrganizationsDashboard));
