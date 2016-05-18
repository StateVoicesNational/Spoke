import React from 'react';
import Formsy from 'formsy-react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import MenuItem from 'material-ui/MenuItem';
import { insert } from '../../api/organizations/methods'
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
export class SignupForm extends React.Component {
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
    Accounts.createUser(data, (accountError) => {
      if (accountError) {
        console.log("account creation error", accountError)
      } else {
        const { organizationName } = data
        insert.call({name: organizationName}, (organizationError) => {
          if (organizationError) {
            console.log("error creating org", organizationError)
          }
        })
      }
    })
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
          <FormsyText
            name="organizationName"
            required
            floatingLabelText="Your organization"
          />
          <RaisedButton
            style={submitStyle}
            type="submit"
            label="Sign up"
            disabled={!this.state.canSubmit}
          />
        </Formsy.Form>
      </Paper>
    )
  }
}
