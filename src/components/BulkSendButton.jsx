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

export default class BulkSendButton extends Component {

  state = {
    showConfirmationDialog: false
  }

  toggleConfirmationDialog = () => {
    this.setState({ showConfirmationDialog: !this.state.showConfirmationDialog })
  }

  sendMessages = async () => {
    await this.props.bulkSendMessages(this.props.assignment.id)

    this.toggleConfirmationDialog()
    this.props.onFinishContact()
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
        onClick={this.sendMessages}
      />
    ]

    return (
      <div className={css(styles.container)}>
        <RaisedButton
          onTouchTap={this.toggleConfirmationDialog}
          label={`Send Bulk (${window.BULK_SEND_CHUNK_SIZE})`}
          primary
        />
        <Dialog
          title='Are you sure?'
          actions={actions}
          open={this.state.showConfirmationDialog}
          modal
        >
          Are you sure you want to send messages?
        </Dialog>
      </div>
    )
  }
}

BulkSendButton.propTypes = {
  assignment: React.PropTypes.object,
  onFinishContact: React.PropTypes.function,
  bulkSendMessages: React.PropTypes.function
}
