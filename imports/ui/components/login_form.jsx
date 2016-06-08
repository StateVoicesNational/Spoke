import React from 'react'
import Paper from 'material-ui/Paper'
import RaisedButton from 'material-ui/RaisedButton'
import Formsy from 'formsy-react'
import { FormsyText } from 'formsy-material-ui/lib'

const errorMessages = {
  emailError: "Please enter a valid email",
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
export class LoginForm extends React.Component {
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

  submitForm(data, resetForm, invalidateForm) {
    const { email, password } = data
    const { onSubmit } = this.props

    Meteor.loginWithPassword(email, password, (loginError) => {
      if (loginError) {
        const key = loginError.reason === 'User not found' ? 'email' : 'password'
        invalidateForm({ [key]: loginError.reason })
      }
      else {
        if (onSubmit) {
          onSubmit()
        }

      }
    });
  }

  notifyFormError(data) {
    console.error('Form error:', data);
  }

  render() {
    let {paperStyle, switchStyle, submitStyle } = styles;
    let { emailError, numericError, urlError } = errorMessages;

    return (
      <Paper style={paperStyle}>
        <Formsy.Form
          onValid={this.enableButton.bind(this)}
          onInvalid={this.disableButton.bind(this)}
          onValidSubmit={this.submitForm.bind(this)}
          onInvalidSubmit={this.notifyFormError.bind(this)}
        >
          <FormsyText
            name="email"
            validations="isEmail"
            validationError={emailError}
            required
            autoFocus
            fullWidth
            floatingLabelText="Email"
          />
          <FormsyText
            required
            name="password"
            type="password"
            fullWidth
            floatingLabelText="Password"
          />
          <RaisedButton
            fullWidth
            style={submitStyle}
            type="submit"
            label="Login"
            disabled={!this.state.canSubmit}
          />
        </Formsy.Form>
      </Paper>
    )
  }
}
