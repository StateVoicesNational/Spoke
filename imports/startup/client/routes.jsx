import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import AssignmentContainer from '../../ui/containers/assignment_container'
import CampaignsContainer from '../../ui/containers/campaigns_container'
import CampaignEditContainer from '../../ui/containers/campaign_edit_container'
import AssignmentsContainer from '../../ui/containers/assignments_container'
import { SignupForm } from '../../ui/components/signup_form'
import TexterSignupPage from '../../ui/pages/texter_signup_page'

import { App } from '../../ui/layouts/app'

import injectTapEventPlugin from 'react-tap-event-plugin'
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

// FlowRouter.route('/assignments', {
//   name: 'texting',
//   action: (params) => {
//     mount(App, {
//       content: () => <AssignmentContainer id={params.id} />
//     })
//   }
// })

FlowRouter.route('/assignments/:id', {
  name: 'assignment',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer id={params.id} />
    })
  }
})

FlowRouter.route('/:organizationId/campaigns/new', {
  name: 'newCampaign',
  action: (params) => {
    mount(App, {
      content: () => <CampaignEditContainer {...params} />
    })
  }
})


FlowRouter.route('/:organizationId/campaigns', {
  name: 'campaigns',
  action: (params) => {
    mount(App, {
      content: () => <CampaignsContainer {...params} />
    })
  }
})

FlowRouter.route('/assignments', {
  name: 'assignments',
  action: () => {
    mount(App, {
      content: () => <AssignmentsContainer />
    })
  }
})

FlowRouter.route('/signup', {
  name: 'signup',
  action: () => {
    mount(App, {
      content: () => <SignupForm />
    })
  }
})

FlowRouter.route('/:organizationId/join', {
  name: 'organizationSignup',
  action: (params) => {
    mount(App, {
      content: () => <TexterSignupPage {...params} />
    })
  }
})