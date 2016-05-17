import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar'
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import IconButton from 'material-ui/IconButton';
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back';
import { FlowRouter } from 'meteor/kadira:flow-router'

import ContentAdd from 'material-ui/svg-icons/content/add'

const styles = {
  root: {
      width: '800px',
      margin: '24px auto',
      padding: '24px'

  }
}
export class CampaignEditPage extends Component {
  handleBack (event) {
    console.log("handle back!?")
    FlowRouter.go('/campaigns')
  }
  render() {
    const { campaigns } = this.props
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
          <CampaignForm />
        </Paper>
      </div>
    )
  }
}
