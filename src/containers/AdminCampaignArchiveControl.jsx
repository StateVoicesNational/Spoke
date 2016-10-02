import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import { StyleSheet, css } from 'aphrodite'
import gql from 'graphql-tag'
import wrapMutations from './hoc/wrap-mutations'
import { connect } from 'react-apollo'
import Dialog from 'material-ui/Dialog'


const styles = StyleSheet.create({
})


class AdminCampaignArchiveControl extends React.Component {
  state = {
    open: false
  }
  handleOpen = () => {
    this.setState({ open: true })
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  handleDeleteCampaign = async () => {
    await this.props.mutations.archiveCampaign(this.props.campaign.id)
    this.handleClose()
  }
  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        onTouchTap={this.handleClose}
      />,
      <FlatButton
        label="Archive"
        primary
        onTouchTap={async () => await this.handleDeleteCampaign()}
      />,
    ];

    return (
      <div>
        { React.cloneElement(this.props.button, { onTouchTap: async () => this.handleDeleteCampaign })} }
        <Dialog
          title={`Archive ${this.props.campaign.title}?`}
          actions={actions}
          open={this.state.open}
          modal
        >

        </Dialog>
      </div>
    )
  }
}

const mapMutationsToProps = () => ({
  archiveCampaign: (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
      archiveCampaign(id: $campaignId) {
        id
      }
    }`,
    variables: { campaignId }
  })
})

AdminCampaignArchiveControl.propTypes = {
  campaign: React.PropTypes.object
}

export default connect({ mapMutationsToProps })(wrapMutations(AdminCampaignArchiveControl))
