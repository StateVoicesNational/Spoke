import React from 'react'
import { AppPage } from '../layouts/app_page'
import { Login } from '../components/login'

export const HomePage = ({ user, organizations }) => (
  <div>
    <Login user={user} organizations={organizations} />
    <AppPage
      navigation=''
      content={
        <div>
          <h1>Welcome!</h1>
          <div>Start texting</div>
        </div>
      }
    />
  </div>
)
