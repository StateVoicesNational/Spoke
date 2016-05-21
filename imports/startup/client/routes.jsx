import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import AssignmentContainer from '../../ui/containers/assignment_container'
import CampaignsContainer from '../../ui/containers/campaigns_container'
import CampaignEditContainer from '../../ui/containers/campaign_edit_container'
import AssignmentsContainer from '../../ui/containers/assignments_container'
import { SignupForm } from '../../ui/components/signup_form'
import TexterSignupPage from '../../ui/pages/texter_signup_page'
import { TextersPage } from '../../ui/pages/texters_page'
import AdminDashboardPage from '../../ui/pages/admin_dashboard_page'
import { AdminNavigation, AppNavigation } from '../../ui/components/navigation'

import { App } from '../../ui/layouts/app'

import injectTapEventPlugin from 'react-tap-event-plugin'
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

// think believe

// FlowRouter.route('/assignments', {
//   name: 'texting',
//   action: (params) => {
//     mount(App, {
//       content: () => <AssignmentContainer id={params.id} />
//     })
//   }
// })

FlowRouter.route('/', {
  name: 'index',
  action: () => {
    mount(App, {
      content: () => <div/>
    })
  }
})

/* TEXTERS */
FlowRouter.route('/:organizationId/join', {
  name: 'texterSignup',
  action: (params) => {
    mount(App, {
      content: () => <TexterSignupPage {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/assignments', {
  name: 'assignments',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentsContainer />,
      navigation: () => <AppNavigation {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/assignments/:id', {
  name: 'assignmentDetails',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer id={params.id} />,
      navigation: () => <AppNavigation {...params} />
    })
  }
})


/* ORGANIZER ADMIN */
FlowRouter.route('/signup', {
  name: 'organizerSignup',
  action: () => {
    mount(App, {
      content: () => <SignupForm />
    })
  }
})

FlowRouter.route('/:organizationId/dashboard', {
  name: 'organizerDashboard',
  action: (params) => {
    mount(App, {
      content: () => <AdminDashboardPage {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})


FlowRouter.route('/:organizationId/texters', {
  name: 'texters',
  action: (params) => {
    mount(App, {
      content: () => <TextersPage { ...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})


FlowRouter.route('/:organizationId/campaigns', {
  name: 'campaigns',
  action: (params) => {
    mount(App, {
      content: () => <CampaignsContainer {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/campaigns/new', {
  name: 'newCampaign',
  action: (params) => {
    mount(App, {
      content: () => <CampaignEditContainer {...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})


