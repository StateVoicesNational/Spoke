import React from 'react'
import { AppPage } from '../layouts/app_page'
import { LoginForm } from '../components/login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'
export const LoginPage = ({ user, organizations, onSubmit }) => (
  <div>
    <LoginForm onSubmit={onSubmit}/>
  </div>
)
