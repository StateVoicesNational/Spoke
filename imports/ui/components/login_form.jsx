import React from 'react';
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import MenuItem from 'material-ui/MenuItem';
import Formsy from 'formsy-react';
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup,
    FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib'

const errorMessages = {
  emailError: "Please only use letters",
  numericError: "Please provide a number",
  urlError: "Please provide a valid URL",
};

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
      <MuiThemeProvider muiTheme={getMuiTheme()}>
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
              floatingLabelText="Email"
            />
            <FormsyText
              required
              name="password"
              type="password"
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
      </MuiThemeProvider>
    )
  }
}
