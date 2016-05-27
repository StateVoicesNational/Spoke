import React from 'react'
import { AppPage } from '../layouts/app_page'
import { PublicNavigation } from '../components/public_navigation'

export const HomePage = ({ user, organizations }) => (
  <div>
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
