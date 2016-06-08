import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import { MessagesPage } from '../../../ui/pages/messages_page'
import { MessagePage } from '../../../ui/pages/message_page'
import { AppDashboardPage } from '../../../ui/pages/app_dashboard_page'
import { TodosPage } from '../../../ui/pages/todos_page'
import { App } from '../../../ui/layouts/app'
import { AssignmentTextingPage } from '../../../ui/pages/assignment_texting_page'

/* APP TEXTER ROUTES */
const appSection = FlowRouter.group({
    prefix: "/app"
});

appSection.route('/', {
  name: 'appDashboard',
  action: (params) => {
    mount(App, {
      content: () => <AppDashboardPage {...params} />
    })
  }
})

const appOrganizationSection = appSection.group({
  prefix: '/:organizationId'
})

appOrganizationSection.route('/todos', {
  name: 'todos',
  action: (params) => {
    mount(App, {
      content: () => <TodosPage {...params} />
    })
  }
})

appOrganizationSection.route('/assignments/:assignmentId/:contactFilter', {
  name: 'textUnmessaged',
  action: (params) => {
    mount(App, {
      content: () => <AssignmentTextingPage {...params} />
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

