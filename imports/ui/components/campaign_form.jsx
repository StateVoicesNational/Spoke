import React, { Component } from 'react'
import TextField from 'material-ui/TextField'

export class CampaignForm extends Component {
  formData() {
    return {
      title: this.refs.title.getValue().trim(),
      description: this.refs.description.getValue().trim()
    }
  }

  render() {
    return (
      <div>
        <TextField
          fullWidth
          ref="title"
          floatingLabelText="Title"
        />
        <TextField
          fullWidth
          ref="description"
          floatingLabelText="Description"
        />
      </div>)
  }
}
