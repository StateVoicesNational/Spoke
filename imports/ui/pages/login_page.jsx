import React from 'react'
import { AppPage } from '../layouts/app_page'
import { Login} from '../components/login'
import { LoginForm } from '../components/login_form'
import { FlowRouter } from 'meteor/kadira:flow-router'
export const LoginPage = ({ user, organizations, onSubmit }) => (
  <div>
    <AppPage
      navigation=''
      content={
        <LoginForm onSubmit={onSubmit}/>
      }
    />
  </div>
)
