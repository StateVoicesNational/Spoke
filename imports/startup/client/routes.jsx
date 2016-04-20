import {FlowRouter} from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'

import AssignmentContainer from '../../ui/containers/assignment_container'
import AppContainer from '../../ui/containers/app_container'
import {App} from '../../ui/layouts/app'

FlowRouter.route('/', {
  name: 'texting',
  action() {
    mount(App, {
      content: () =>  <AppContainer />
    })
  }
})

FlowRouter.route('/assignments/:id', {
  name: 'assignment',
  action: function(params) {
    console.log(params);

    mount(App, {
      content: () =>  <AssignmentContainer id={params.id}/>
    })
  }
})