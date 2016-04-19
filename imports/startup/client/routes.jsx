import {FlowRouter} from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'

import AppContainer from '../../ui/containers/app_container'
import {App} from '../../ui/layouts/app'
import {TextingPage} from '../../ui/pages/texting_page'
import {SetupPage} from '../../ui/pages/setup_page'

FlowRouter.route('/', {
  name: 'texting',
  action() {
    const dummyAssignments = [
        {
            id: 1,
            name: 'CA Phonebanking',
            description: 'Help volunteers sign up for phonebanking sessions.',
            incompleteMessageCount: 20,
            incompleteReplyCount: 12
        },
        {
            id: 2,
            name: 'GOTV!',
            description: 'Make sure everyone votes!',
            incompleteMessageCount: 102,
            incompleteReplyCount: 18
        },
    ]
    mount(App, {
        // TODO props not worknig from app_container for some reeason
      content: () =>  <AppContainer />
    })
  }
})

// FlowRouter.route('/setup', {
//   name: 'setup',
//   action() {
//     mount(AppContainer, {
//       content: (props) => <SetupPage {...props} />
//     })
//   }
// })
