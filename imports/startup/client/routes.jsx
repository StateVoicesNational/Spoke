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
import { TodosPage } from '../../ui/pages/todos_page'
import { App } from '../../ui/layouts/app'
import { Public } from '../../ui/layouts/public'

import injectTapEventPlugin from 'react-tap-event-plugin'
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

/* PUBLIC ROUTES*/
FlowRouter.route('/', {
  name: 'index',
  action: () => {
    mount(Public, {
      content: () => <HomePage />
    })
  }
})

FlowRouter.route('/login', {
  name: 'login',
  action: () => {
    mount(Public, {
      content: () => <LoginPage onSubmit={() => FlowRouter.go('/')}/>
    })
  }
})

FlowRouter.route('/signup', {
  name: 'createTeam',
  action: () => {
    mount(Public, {
      content: () => <SignupForm />
    })
  }
})

FlowRouter.route('/:organizationId/join', {
  name: 'texterSignup',
  action: (params) => {
    mount(Public, {
      content: () => <TexterSignupPage {...params} />
    })
  }
})
/* END PUBLIC ROUTES */

/* APP TEXTER ROUTES */
const appSection = FlowRouter.group({
    prefix: "/app"
});

const appOrganizationSection = appSection.group({
  prefix: '/:organizationId'
})

appOrganizationSection.route('/assignments', {
  name: 'assignments',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentsContainer {...params} />
    })
  }
})

appOrganizationSection.route('/todos', {
  name: 'todos',
  action: (params) => {
    mount(App, {
      content: () => <TodosPage {...params} />
    })
  }
})
appOrganizationSection.route('/assignments/:assignmentId', {
  name: 'assignment',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentContainer {...params} />
    })
  }
})

appOrganizationSection.route('/messages', {
  name: 'messages',
  action: (params) => {
    mount(App, {
      content: () => <MessagesPage {...params} />
    })
  }
})

appOrganizationSection.route('/messages/:campaignContactId', {
  name: 'message',
  action: (params) => {
    mount(App, {
      content: () => <MessagePage {...params} />
    })
  }
})
/* END APP TEXTER ROUTES */

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
  name: 'optout.list',
  action: (params) => {
    mount(App, {
      content: () => <OptOutsPage { ...params} />,
      navigation: () => <AdminNavigation {...params} />
    })
  }
})
/* END APP ADMIN ROUTES */
