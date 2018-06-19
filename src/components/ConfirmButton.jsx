import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { StyleSheet, css } from 'aphrodite'
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';

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
      <Button
        label='No'
        primary
        onClick={this.toggleConfirmationDialog}
      />,
      <Button
        label='Yes'
        primary
        onClick={this.handleConfirm}
      />
    ]

    return (
      <div className={css(styles.container)}>
        <Button
          variant="contained"
          onClick={this.toggleConfirmationDialog}
          label={this.props.label}
        />
        <Dialog
          open={this.state.showConfirmationDialog}
          modal={true}
        >
          <DialogTitle>{this.props.label}</DialogTitle>
          <DialogContent>Are you sure?</DialogContent>
          <DialogActions>{actions}</DialogActions>
        </Dialog>
      </div>
    )
  }
}

ConfirmButton.propTypes = {
  onConfirm: PropTypes.function,
  label: PropTypes.string
}
