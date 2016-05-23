import React from 'react'
import { AppPage } from '../layouts/app_page'
import { Login} from '../components/login'
import { LoginForm } from '../components/login_form'

export const LoginPage = ({ user, organizations }) => (
  <div>
    <Login user={user} organizations={organizations} />
    <AppPage
      navigation=''
      content={
        <LoginForm />
      }
    />
  </div>
)
