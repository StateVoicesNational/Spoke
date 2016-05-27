import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import AssignmentContainer from '../../ui/containers/assignment_container'
import CampaignsContainer from '../../ui/containers/campaigns_container'
import AssignmentsContainer from '../../ui/containers/assignments_container'
import { SignupForm } from '../../ui/components/signup_form'
import TexterSignupPage from '../../ui/pages/texter_signup_page'
import { TextersPage } from '../../ui/pages/texters_page'
import { MessagesPage } from '../../ui/pages/messages_page'
import { MessagePage } from '../../ui/pages/message_page'
import { AdminDashboardPage } from '../../ui/pages/admin_dashboard_page'
import { AdminNavigation, AppNavigation } from '../../ui/components/navigation'
import { HomePage } from '../../ui/pages/home_page'
import { LoginPage } from '../../ui/pages/login_page'
import { OptOutsPage } from '../../ui/pages/opt_outs_page'
import { CampaignPage } from '../../ui/pages/campaign_page'
import { CampaignNewPage } from '../../ui/pages/campaign_new_page'
import { CampaignEditPage } from '../../ui/pages/campaign_edit_page'
import { App } from '../../ui/layouts/app'
import { Main } from '../../ui/layouts/main'

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
      content: () => <HomePage />
    })
  }
})

FlowRouter.route('/login', {
  name: 'login',
  action: () => {
    mount(App, {
      content: () => <LoginPage onSubmit={() => FlowRouter.go('/')}/>
    })
  }
})
/* TEXTERS */
FlowRouter.route('/:organizationId/join', {
  name: 'texterSignup',
  action: (params) => {
    mount(Main, {
      content: () => <TexterSignupPage {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/assignments', {
  name: 'assignments',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentsContainer {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/assignments/:assignmentId', {
  name: 'assignmentDetails',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/messages', {
  name: 'messages',
  action: (params) => {
    mount(App, {
      content: () => <MessagesPage {...params} />
    })
  }
})

FlowRouter.route('/:organizationId/messages/:campaignContactId', {
  name: 'messageThread',
  action: (params) => {
    mount(App, {
      content: () => <MessagePage {...params} />
    })
  }
})

FlowRouter.route('/signup', {
  name: 'organizerSignup',
  action: () => {
    mount(App, {
      content: () => <SignupForm />
    })
  }
})

/* ORGANIZER ADMIN */

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
  name: 'adminDashboard',
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
  name: 'campaign.list',
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
  name: 'optout.list',
  action: (params) => {
    mount(App, {
      content: () => <OptOutsPage { ...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})


