import PropTypes from 'prop-types'
import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import { StyleSheet, css } from 'aphrodite'
import Dialog from 'material-ui/Dialog'

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: 'inline-block',
    marginLeft: 20
  }
})

export default class ConfirmButton extends Component {

  state = {
    showConfirmationDialog: false
  }

  toggleConfirmationDialog = () => {
    this.setState({ showConfirmationDialog: !this.state.showConfirmationDialog })
  }

  handleConfirm = async () => {
    await this.props.onConfirm()
    this.toggleConfirmationDialog()
  }

  render() {
    const actions = [
      <FlatButton
        label='No'
        primary
        onClick={this.toggleConfirmationDialog}
      />,
      <FlatButton
        label='Yes'
        primary
        onClick={this.handleConfirm}
      />
    ]

    return (
      <div className={css(styles.container)}>
        <RaisedButton
          onTouchTap={this.toggleConfirmationDialog}
          label={this.props.label}
        />
        <Dialog
          title={this.props.label}
          actions={actions}
          open={this.state.showConfirmationDialog}
          modal
        >
          Are you sure?
        </Dialog>
      </div>
    )
  }
}

ConfirmButton.propTypes = {
  onConfirm: PropTypes.function,
  label: PropTypes.string
}
