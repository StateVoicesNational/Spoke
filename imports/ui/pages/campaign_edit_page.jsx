import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar'
import { CampaignForm } from '../components/campaign_form'
import IconButton from 'material-ui/IconButton'
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back'
import { FlowRouter } from 'meteor/kadira:flow-router'

const styles = {
  root: {
    width: '800px',
    margin: '24px auto',
    padding: '24px'

  }
}
export class CampaignEditPage extends Component {
  handleBack(event) {
    const { organizationId } = this.props
    FlowRouter.go(`/${organizationId}/campaigns`)
  }

  render() {
    const { organizationId, texters } = this.props
    console.log("TEXTERS", texters)
    return (
    <div>
        <AppBar
          iconElementLeft={
            <IconButton onTouchTap={ this.handleBack.bind(this) }>
              <ArrowBackIcon />
            </IconButton>}
          title="Create new campaign"
        />
        <Paper style={styles.root}>
          <CampaignForm organizationId={organizationId} texters={texters} />
        </Paper>
      </div>
    )
  }
}
