import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import CampaignsContainer from '../../../ui/containers/campaigns_container'
import { TextersPage } from '../../../ui/pages/texters_page'
import { AdminDashboardPage } from '../../../ui/pages/admin_dashboard_page'
import { AdminNavigation } from '../../../ui/components/navigation'
import { OptOutsPage } from '../../../ui/pages/opt_outs_page'
import { CampaignPage } from '../../../ui/pages/campaign_page'
import { CampaignNewPage } from '../../../ui/pages/campaign_new_page'
import { CampaignEditPage } from '../../../ui/pages/campaign_edit_page'
import { App } from '../../../ui/layouts/app'

/* END APP ADMIN ROUTES */
const adminSection = FlowRouter.group({
    prefix: "/admin"
});

const adminOrganizationSection = adminSection.group({
  prefix: '/:organizationId'
})

adminSection.route('/', {
  name: 'adminDashboard',
  action: (params) => {
    mount(App, {
      content: () => <AdminDashboardPage {...params} />
    })
  }
})

adminOrganizationSection.route('/', {
  name: 'adminOrganizationDashboard',
  action: (params) => {
    mount(App, {
      content: () => <AdminDashboardPage {...params} />
    })
  }
})


adminOrganizationSection.route('/texters', {
  name: 'texters',
  action: (params) => {
    mount(App, {
      content: () => <TextersPage { ...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})


adminOrganizationSection.route('/campaigns', {
  name: 'campaigns',
  action: (params) => {
    mount(App, {
      content: () => <CampaignsContainer {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})

adminOrganizationSection.route('/campaigns/:campaignId/edit', {
  name: 'campaign.edit',
  action: (params) => {
    mount(App, {
      content: () => <CampaignEditPage {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})

adminOrganizationSection.route('/campaigns/new', {
  name: 'campaign.new',
  action: (params) => {
    mount(App, {
      content: () => <CampaignNewPage {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})

adminOrganizationSection.route('/campaigns/:campaignId', {
  name: 'campaign',
  action: (params) => {
    mount(App, {
      content: () => <CampaignPage {...params} />
    })
  }
})

adminOrganizationSection.route('/optouts', {
  name: 'optouts',
  action: (params) => {
    mount(App, {
      content: () => <OptOutsPage { ...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})
/* END APP ADMIN ROUTES */
