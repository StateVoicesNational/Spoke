import React, { Component } from 'react'
import TextField from 'material-ui/TextField'

const styles = {
  textarea: {
    padding: 20
  }
}

export class MessageField extends Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)

    this.state = {
      inputValue: ''
    }
  }

  componentWillReceiveProps(props) {
    inputValue = props.script
    this.setState({ inputValue })
  }

  handleChange(event) {
    this.setState({
      inputValue: event.target.value
    })
  }

  getValue() {
    return this.refs.input.getValue()
  }
  render() {
    return (
      <div style={styles.textarea}>
      <TextField
        ref="input"
        floatingLabelText="Your message"
        value={this.state.inputValue}
        onChange={this.handleChange}
        multiLine
        fullWidth
      />
    </div>)
  }
}
