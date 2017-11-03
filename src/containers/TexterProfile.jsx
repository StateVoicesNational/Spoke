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
import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'

const styles = StyleSheet.create({
  homeButton: {
    marginTop: '20px'
  }
})

export default class TexterProfile extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      value: 'Property Value'
    }
  }

  handleEdit = event => {
    console.log('event:', event.target.value );
    this.setState({
      value: event.target.value
    })

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
            <h4> Edit Profile </h4>
            <TextField
              id="text-field-controled"
              name="firstName"
              hintText="First Name"
              floatingLabelText="First Name"
              defaultValue={currentUser.firstName}
              onChange={this.handleEdit}
              underlineShow={false}
            />
            <Divider />
            <TextField
              id="text-field-controled"
              name="lastName"
              floatingLabelText="Last Name"
              hintText="Last Name"
              defaultValue={currentUser.lastName}
              onChange={this.handleEdit}
              underlineShow={false}
            />
          </CardText>
        </Card>
        <RaisedButton
          className={css(styles.homeButton)}
          label="Back to Campaigns"
        />
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
