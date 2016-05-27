import React from 'react'
import Formsy from 'formsy-react'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import { FormsyText } from 'formsy-material-ui/lib'
import { addTexter } from '../../api/organizations/methods'
import { TexterSignupForm } from './texter_signup_form'
import { FlowRouter } from 'meteor/kadira:flow-router'

const errorMessages = {
  emailError: "Please only use letters",
}

const styles = {
  paperStyle: {
    width: 400,
    margin: 'auto',
    padding: 24
  },
  switchStyle: {
    marginBottom: 16
  },
  submitStyle: {
    marginTop: 32
  }
}

export class TexterSignup extends React.Component {
  handleExistingUserJoin() {
    console.log("calling texter!?")
    const { organization } = this.props
    addTexter.call({ organizationId: organization._id }, (err) => {
      if (err) {
        alert(err)
      } else {
        FlowRouter.go(`/assignments`)
        console.log("successfully joined!")
      }
    })
  }

  renderExistingUser() {
    const { user, organization } = this.props
    console.log('user')
    return (
        <Formsy.Form
          onValidSubmit={this.handleExistingUserJoin.bind(this)}
        >
          <RaisedButton
            primary
            type="submit"
            label={`Join ${organization.name}`}
          />
        </Formsy.Form>
    )
  }

  render() {
    const { organization, user } = this.props
    let {paperStyle, switchStyle, submitStyle } = styles;
    let { emailError, numericError, urlError } = errorMessages;

    return (
      <Paper style={paperStyle}>
        <div>
          <h1>{ user ? `Hi, ${user.firstName}.` : 'Welcome.'}</h1>
          <p>
            You're signing up to send texts for {organization.name}. Welcome aboard!
          </p>
          { user ? this.renderExistingUser() : <TexterSignupForm /> }
        </div>
      </Paper>
    )
  }
}
