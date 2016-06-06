import React from 'react'
import { CampaignForm } from '../components/campaign_form'
import { AppPage } from '../../ui/layouts/app_page'
import { AdminNavigation } from '../../ui/components/navigation'
import { createContainer } from 'meteor/react-meteor-data'
import  TextField from 'material-ui/TextField'
import { FlowRouter } from 'meteor/kadira:flow-router'
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';

class _CampaignNewPage extends React.Component {
  render () {
    const { organizationId, texters, loading } = this.props
    return (
      <AppPage
        navigation={
          <AdminNavigation
            title="Create new campaign"
            organizationId={organizationId}
            backToSection="campaigns"
            hideSidebar
          />
        }
        content={ texters.length === 0 ? (
            <Card>
              <CardHeader
              />

              <CardTitle
                title="A campaign needs texters!"
                subtitle="Share this link to get people signed up to text for you"
              />
              <CardText>
                <TextField
                  ref="linkField"
                  autoFocus
                  onFocus={(event) => event.target.select()}
                  fullWidth
                  value={`${Meteor.absoluteUrl()}${organizationId}/join`}
                />
              </CardText>
            </Card>
          ) : (
            <CampaignForm
              organizationId={organizationId}
              texters={texters}
            />
        )}
        hideSidebar
        loading={loading}
      />
    )
  }
}

export const CampaignNewPage = createContainer(({ organizationId }) => {
 const handle = Meteor.subscribe('campaign.new', organizationId)
  const texters = Roles.getUsersInRole('texter', organizationId).fetch()
  console.log(texters)
  return {
    organizationId,
    texters,
    loading: !handle.ready()
  }
}, _CampaignNewPage)
