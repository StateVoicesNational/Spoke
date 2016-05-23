import React, { Component } from 'react'
import Paper from 'material-ui/Paper'
import AppBar from 'material-ui/AppBar'
import { CampaignForm } from '../components/campaign_form'
import IconButton from 'material-ui/IconButton'
import ArrowBackIcon from 'material-ui/svg-icons/navigation/arrow-back'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { AppPage } from '../../ui/layouts/app_page'
import { BackNavigation } from '../../ui/components/navigation'

const styles = {
  root: {
    width: '800px',
    margin: '24px auto',
    padding: '24px'

  }
}
export class CampaignEditPage extends Component {
  render() {
    const { organizationId, texters, loading } = this.props
    return (
      <AppPage
        navigation={
          <BackNavigation
            organizationId={organizationId}
            title="Create new campaign"
            backToSection="campaigns"
          />
        }
        content={loading ? '' : <CampaignForm organizationId={organizationId} texters={texters} />}
        loading={loading}
      />
    )
  }
}
