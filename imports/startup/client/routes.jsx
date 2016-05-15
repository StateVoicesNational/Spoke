import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import AssignmentContainer from '../../ui/containers/assignment_container'
import CampaignsContainer from '../../ui/containers/campaigns_container'
import CampaignEditContainer from '../../ui/containers/campaign_edit_container'

import { App } from '../../ui/layouts/app'

import injectTapEventPlugin from 'react-tap-event-plugin'
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

FlowRouter.route('/assignments', {
  name: 'texting',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer id={params.id} />
    })
  }
})

FlowRouter.route('/assignments/:id', {
  name: 'assignment',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer id={params.id} />
    })
  }
})

FlowRouter.route('/campaigns/new', {
  name: 'newCampaign',
  action: () => {
    mount(App, {
      content: () => <CampaignEditContainer />
    })
  }
})


FlowRouter.route('/campaigns', {
  name: 'campaigns',
  action: () => {
    mount(App, {
      content: () => <CampaignsContainer />
    })
  }
})