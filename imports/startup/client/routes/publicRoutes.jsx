import { FlowRouter } from 'meteor/kadira:flow-router'
import React from 'react'
import { mount } from 'react-mounter'
import { SignupForm } from '../../../ui/components/signup_form'
import TexterSignupPage from '../../../ui/pages/texter_signup_page'
import { HomePage } from '../../../ui/pages/home_page'
import { LoginPage } from '../../../ui/pages/login_page'
import { Public } from '../../../ui/layouts/public'

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

