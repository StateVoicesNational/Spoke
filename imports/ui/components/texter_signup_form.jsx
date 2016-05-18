import React from 'react'
import Formsy from 'formsy-react'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import { FormsyText } from 'formsy-material-ui/lib'
import { addTexter } from '../../api/organizations/methods'

const errorMessages = {
  emailError: "Please only use letters",
}

const styles = {
  paperStyle: {
    width: 300,
    margin: 'auto',
    padding: 20
  },
  switchStyle: {
    marginBottom: 16
  },
  submitStyle: {
    marginTop: 32
  }
}

export class TexterSignupForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      canSubmit: false
    };
  }

  enableButton() {
    this.setState({
      canSubmit: true,
    });
  }

  disableButton() {
    this.setState({
      canSubmit: false,
    });
  }

  submitForm(data) {
    const { organization } = this.props
    Accounts.createUser(data, (accountError) => {
      if (accountError) {
        console.log("account creation error", accountError)
      } else {
        addTexter.call({organizationId: organization._id}, (organizationError) => {
          if (organizationError) {
            console.log("error creating org", organizationError)
          } else {
            console.log("successfully joined!")
          }
        })
      }
    })
  }

  notifyFormError(data) {
    console.error('Form error:', data);
  }

  render() {
    const { organization } = this.props
    let {paperStyle, switchStyle, submitStyle } = styles;
    let { emailError, numericError, urlError } = errorMessages;

    return (
      <Paper style={paperStyle}>
        <div>
          You're signing up to text for {organization.name}.
        </div>
        <Formsy.Form
          onValid={this.enableButton.bind(this)}
          onInvalid={this.disableButton.bind(this)}
          onValidSubmit={this.submitForm.bind(this)}
          onInvalidSubmit={this.notifyFormError.bind(this)}
        >
          <FormsyText
            name="firstName"
            required
            floatingLabelText="First name"
          />
          <FormsyText
            name="lastName"
            required
            floatingLabelText="Last name"
          />
          <FormsyText
            name="email"
            validations="isEmail"
            validationError={emailError}
            required
            floatingLabelText="Your email"
          />
          <FormsyText
            name="password"
            type="password"
            required
            floatingLabelText="Password"
          />
          <RaisedButton
            style={submitStyle}
            type="submit"
            label="Join organization"
            disabled={!this.state.canSubmit}
          />
        </Formsy.Form>
      </Paper>
    )
  }
}
