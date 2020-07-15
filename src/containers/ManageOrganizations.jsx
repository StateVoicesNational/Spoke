import React from "react";
import { Card, CardText } from "material-ui/Card";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import RaisedButton from "material-ui/RaisedButton";
import { red500 } from "material-ui/styles/colors";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import theme from "../styles/theme";
import Dialog from "material-ui/Dialog";
import yup from "yup";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import PropTypes from "prop-types";

const styles = StyleSheet.create({
  cards: {
    display: "flex",
    flexWrap: "wrap"
  },
  card: {
    marginRight: 10,
    marginBottom: 10
  },
  buttons: {
    display: "flex"
  },
  editButton: {
    marginRight: 6
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    marginBotton: 16
  },
  submit: {
    marginTop: 32,
    display: "flex",
    justifyContent: "flex-end"
  }
});

export class ManageOrganizations extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const organizations = this.props.data.organizations;
    return (
      <div className={css(styles.cards)}>
        {organizations.map(org => (
          <Card className={css(styles.card)} id={org.id} key={org.id}>
            <CardText>
              <p>{org.name}</p>
            </CardText>
            <CardText className={css(styles.buttons)}>
              <RaisedButton
                className={css(styles.editButton)}
                primary
                label="Edit"
                labelPosition="before"
                icon={<CreateIcon />}
                onTouchTap={console.log("edit")}
              />
              <RaisedButton
                label="Delete"
                labelPosition="before"
                icon={<DeleteIcon color={red500} />}
                onTouchTap={console.log("delete")}
              />
            </CardText>
          </Card>
        ))}
        <FloatingActionButton
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
      </div>
    );
  }
}

ManageOrganizations.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
};

const queries = {
  data: {
    query: gql`
      query getInstanceOrganizations {
        organizations {
          id
          name
        }
      }
    `
  }
};

const mutations = {
  createOrganization: ownProps => (name, userId, inviteId) => ({
    mutation: gql`
      mutation createOrganization(
        $name: String!
        $userId: String!
        $inviteId: String!
      ) {
        createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
          id
        }
      }
    `,
    variables: { name, userId, inviteId }
  })
};

export default loadData({ queries, mutations })(
  withRouter(ManageOrganizations)
);
