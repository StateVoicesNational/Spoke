import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import { CampaignList } from '../components/campaign_list'
import { CampaignForm } from '../components/campaign_form'
import FloatingActionButton from 'material-ui/FloatingActionButton'

import ContentAdd from 'material-ui/svg-icons/content/add'

export class CampaignEditPage extends Component {
  render() {
    const { campaigns } = this.props
    return <Paper>
      <CampaignForm />
    </Paper>
  }
}
