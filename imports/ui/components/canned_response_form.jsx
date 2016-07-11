import React, { Component } from 'react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
export class CannedResponseForm extends Component {

  getModel() {
    return this.refs.form.getModel()
  }

  render() {
    const { onValid, onInvalid } = this.props
    return (
      <Formsy.Form
        ref="form"
        onValid={onValid}
        onInvalid={onInvalid}
      >
        <FormsyText
          name="title"
          autoFocus
          required
          floatingLabelText="Title"
        />
        <FormsyText
          name="text"
          fullWidth
          floatingLabelText="Script"
          required
          multiLine
        />
      </Formsy.Form>
    )
  }
}
