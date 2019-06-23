import PropTypes from 'prop-types'
import React from 'react'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import wrapMutations from './hoc/wrap-mutations'
import Dialog from 'material-ui/Dialog'
import RaisedButton from 'material-ui/RaisedButton'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  button: {
    marginLeft: '30px'
  },
  container: {
    display: 'flex',
    flexDirection: 'column'
  }
})

class InitiatePasswordResetDialog extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      alreadyInitiated: false,
      open: false
    }
  }

  actions = () => [
    !this.state.alreadyInitiated && <RaisedButton
      className={css(styles.button)}
      label='Initate Password Reset'
      onTouchTap={async () => this.initiatePasswordReset()}
      primary
    />,
    <RaisedButton
      className={css(styles.button)}
      label='Close'
      onTouchTap={async () => this.closeDialog()}
      secondary
    />
  ]

  initiatePasswordReset = async () => {
    await this.props.mutations.initiatePasswordReset()
    this.setState({ alreadyInitiated: true })
  }

  editingSelf = () => {
    return this.props.currentUser.id === this.props.userId
  }

  openDialog = () => {
    if (this.props.disabled) {
      return
    }

    this.setState({ open: true })
  }

  closeDialog = () => {
    this.setState({
      open: false,
      alreadyInitiated: false
    })
  }

  text = () => {
    if (this.editingSelf()) {
      if (this.state.alreadyInitiated) {
        return 'Check your email. We sent instructions to reset your password.'
      }
      return "To reset your password, click Initiate Password Reset. We'll send instructions via email."
    }

    // else
    if (this.state.alreadyInitiated) {
      return 'Tell the user to check their email. We sent instructions to reset their password.'
    }
    return "To reset this user's password, click Initiate Password Reset. We'll send them instructions via email."
  }

  render = () => {
    return this.props.currentUser.loading ? null : (<span>
      <RaisedButton
        onTouchTap={this.openDialog}
        label='Reset password'
        variant='outlined'
        disabled={this.props.disabled}
      />
      <Dialog
        className={css(styles.container)}
        open={this.state.open}
        actions={this.actions()}
        modal
        title='Initiate Password Reset'
      >
        {this.text()}
      </Dialog>
    </span>)
  }
}

InitiatePasswordResetDialog.propTypes = {
  currentUser: PropTypes.object,
  organizationId: PropTypes.string,
  userId: PropTypes.string,
  mutations: PropTypes.object,
  disabled: PropTypes.boolean
}

const mapMutationsToProps = ({ ownProps }) => ({
  initiatePasswordReset: () => ({
    mutation: gql`mutation initiatePasswordReset($organizationId: String!, $userId: String!) {
      initiatePasswordReset(organizationId: $organizationId, userId: $userId)
    }`,
    variables: {
      userId: ownProps.userId,
      organizationId: ownProps.organizationId
    }
  })
})

export default loadData(wrapMutations(InitiatePasswordResetDialog), {
  mapMutationsToProps
})

