import React from 'react';
import Formsy from 'formsy-react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import MenuItem from 'material-ui/MenuItem';
import { insert } from '../../api/organizations/methods'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup,
    FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib'

const errorMessages = {
  emailError: "Please only use letters",
  numericError: "Please provide a number",
  urlError: "Please provide a valid URL",
};

const styles = {
  paperStyle: {
    width: 400,
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

  submitForm(data, resetForm, invalidateForm) {
    Accounts.createUser(data, (accountError) => {
      if (accountError) {
        invalidateForm( { email: accountError.message })
      } else {
        const { organizationName } = data
        insert.call({name: organizationName}, (organizationError) => {
          if (organizationError) {
            alert(organizationError)
          } else {
            FlowRouter.go('adminDashboard')
          }
        })
      }
    })
  }

  notifyFormError(data) {
    console.error('Form error:', data);
  }

  render() {
    let {switchStyle, submitStyle, paperStyle} = styles;
    let { emailError, numericError, urlError } = errorMessages;

    return (
      <Paper style={styles.paperStyle}>
        <Formsy.Form
          onValid={this.enableButton.bind(this)}
          onInvalid={this.disableButton.bind(this)}
          onValidSubmit={this.submitForm.bind(this)}
          onInvalidSubmit={this.notifyFormError.bind(this)}
        >
          <FormsyText
            name="firstName"
            required
            autoFocus
            fullWidth
            floatingLabelText="First name"
          />
          <FormsyText
            name="lastName"
            required
            fullWidth
            floatingLabelText="Last name"
          />
          <FormsyText
            name="email"
            validations="isEmail"
            validationError={emailError}
            required
            fullWidth
            floatingLabelText="Your email"
          />
          <FormsyText
            name="password"
            type="password"
            required
            fullWidth
            floatingLabelText="Password"
          />
          <FormsyText
            name="organizationName"
            required
            fullWidth
            hintText="Bartlet Campaign"
            floatingLabelText="Your organization"
          />
          <RaisedButton
            fullWidth
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
