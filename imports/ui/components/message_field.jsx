import React, { Component } from 'react'
import TextField from 'material-ui/TextField'

const styles = {
  textarea: {
    padding: 20,
  }
}

export class MessageField extends Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)

    this.state = {
      inputValue: props.initialScript
    }
  }

  componentWillReceiveProps(props) {
    const inputValue = props.initialScript
    console.log("inputValue", inputValue, props.initialScript, props)
    this.setState({ inputValue })
  }

  getValue() {
    return this.refs.input.getValue()
  }

  handleChange(event) {
    this.setState({
      inputValue: event.target.value
    })
  }

  render() {
    return (
      <div style={styles.textarea}>
      <TextField
        autoFocus
        ref="input"
        floatingLabelText="Your message"
        value={this.state.inputValue}
        onChange={this.handleChange}
        multiLine
        fullWidth
      />
    </div>
    )
  }
}
