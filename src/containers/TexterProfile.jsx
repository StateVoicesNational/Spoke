import React from 'react'
import loadData from './hoc/load-data'
import gql from 'graphql-tag'
import Form from 'react-formal'
import yup from 'yup'
import { StyleSheet, css } from 'aphrodite'
import wrapMutations from './hoc/wrap-mutations'
import theme from '../styles/theme'
import Paper from 'material-ui/Paper'
import { withRouter } from 'react-router'
import GSForm from '../components/forms/GSForm'
import { connect } from 'react-apollo'
import { ListItem, List } from 'material-ui/List'
import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import Divider from 'material-ui/Divider'

const styles = StyleSheet.create({
  container: {
    marginTop: '5vh',
    textAlign: 'center',
    color: theme.colors.white
  },
  formContainer: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginRight: 'auto',
    marginLeft: 'auto',
    maxWidth: '80%'
  },
  form: {
    marginTop: 40,
    maxWidth: '80%',
    marginRight: 'auto',
    marginLeft: 'auto'
  }
})

export default class TexterProfile extends React.Component {

  editFirstName(){

  }

  render() {
    const { currentUser } = this.props.data
    if (!currentUser) {
      return <div />
    }

    console.log('current user data:', currentUser);
    return (
      <div>
        <Card>
          <CardHeader
            title={currentUser.displayName}
            subtitle={currentUser.email}
            actAsExpander={true}
            showExpandableButton={true}
          />
          <CardText expandable={true}>
            User Information Form Here
          </CardText>
        </Card>
        <Divider />
        <Card>
          <CardHeader
            title='Organizations'
          />
          <List>
            {currentUser.organizations.map((organization) => (
              <ListItem
                key={organization.id}
                primaryText={organization.name}
                value={organization.id}
              />
            ))}
          </List>
        </Card>
      </div>
    )
  }
}

TexterProfile.propTypes = {
  data: React.PropTypes.object,
  router: React.PropTypes.object
}


const mapQueriesToProps = () => ({
  data: {
    query: gql`query getCurrentUserForMenu {
      currentUser {
        id
        displayName
        firstName
        lastName
        email
        organizations {
          id
          name
        }
      }
    }`,
    forceFetch: true
  },
  // editUserFirstName: (userId) => ({
  //   mutation: gql`mutation editUserFirstName($userId: String!) {
  //     editUserFirstName(id: $userId){
  //       ${userFirstName}
  //     }
  //   }`,
  //   variables: { userId }
  // })
})

export default connect({
  mapQueriesToProps
})(withRouter(TexterProfile))
