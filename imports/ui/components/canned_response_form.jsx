import React, { Component } from 'react'
import { FormsyText, FormsyDate } from 'formsy-material-ui/lib'
export class CannedResponseForm extends Component {
  constructor(props) {
    super(props)
    const { script } = props
    this.handleTitleChange = this.handleTitleChange.bind(this)
    this.handleTextChange = this.handleTextChange.bind(this)

    if (script) {
      const { text, title } = script
      this.state = {
        text,
        title
      }
    } else {
      this.state = {
        text: '',
        title: ''
      }
    }
  }
  getModel() {
    return this.refs.form.getModel()
  }

  handleTextChange(event) {
    this.setState({
      text: event.target.value
    })
  }

  handleTitleChange(event) {
    this.setState({
      title: event.target.value
    })
  }

  render() {
    const { onValid, onInvalid } = this.props
    const { text, title } = this.state
    return (
      <Formsy.Form
        ref="form"
        onValid={onValid}
        onInvalid={onInvalid}
      >
        <FormsyText
          name="title"
          onChange={this.handleTitleChange}
          autoFocus
          required
          floatingLabelText="Title"
          value={title}
        />
        <FormsyText
          name="text"
          onChange={this.handleTextChange}
          fullWidth
          floatingLabelText="Script"
          value={text}
          required
          multiLine
        />
      </Formsy.Form>
    )
  }
}
