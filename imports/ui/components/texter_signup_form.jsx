import React from 'react'
import Formsy from 'formsy-react'
import RaisedButton from 'material-ui/RaisedButton'
import { FormsyText } from 'formsy-material-ui/lib'
import { addTexter } from '../../api/organizations/methods'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { getFormattedPhoneNumber } from '../../../both/phone_format'

const errorMessages = {
  emailError: 'Please enter a valid email',
  cellError: 'Please enter a valid mobile number'
}

const styles = {
  submitStyle: {
    marginTop: 32
  }
}

Formsy.addValidationRule('isPhoneNumber', (values, value) => !!getFormattedPhoneNumber(value))


export class TexterSignupForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      canSubmit: false
    }
  }

  enableButton() {
    this.setState({
      canSubmit: true
    })
  }

  disableButton() {
    this.setState({
      canSubmit: false
    })
  }

  submitForm(data) {
    const { organization } = this.props
    data.cell = getFormattedPhoneNumber(data.cell)
    Accounts.createUser(data, (accountError) => {
      if (accountError) {
        alert('There was an error signing you up')
      } else {
        addTexter.call({ organizationId: organization._id }, (organizationError) => {
          if (organizationError) {
            alert('There was an error joining the organization')
          } else {
            FlowRouter.go(`${organization._id}/assignments`)
          }
        })
      }
    })
  }

  notifyFormError(data) {
    console.error('Form error:', data)
  }

  render() {
    const { organization } = this.props
    let { submitStyle } = styles
    let { emailError, cellError } = errorMessages

    return (
      <Formsy.Form
        onValid={this.enableButton.bind(this)}
        onInvalid={this.disableButton.bind(this)}
        onValidSubmit={this.submitForm.bind(this)}
        onInvalidSubmit={this.notifyFormError.bind(this)}
      >
        <FormsyText
          name="firstName"
          autoFocus
          fullWidth
          required
          floatingLabelText="First name"
        />
        <FormsyText
          name="lastName"
          fullWidth
          required
          floatingLabelText="Last name"
        />
        <FormsyText
          name="email"
          fullWidth
          validations="isEmail"
          validationError={emailError}
          required
          floatingLabelText="Your email"
        />
        <FormsyText
          name="cell"
          validations="isPhoneNumber"
          fullWidth
          validationError={cellError}
          required
          floatingLabelText="Your cell"
        />
        <FormsyText
          fullWidth
          name="password"
          type="password"
          required
          floatingLabelText="Password"
        />
        <RaisedButton
          fullWidth
          style={submitStyle}
          type="submit"
          label="Join organization"
          disabled={!this.state.canSubmit}
        />
      </Formsy.Form>
    )
  }
}
