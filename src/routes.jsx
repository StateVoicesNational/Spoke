import { IndexRoute, IndexRedirect, Route } from 'react-router'
import App from './components/App'
import AdminDashboard from './components/AdminDashboard'
import AdminCampaignList from './containers/AdminCampaignList'
import AdminCampaignStats from './containers/AdminCampaignStats'
import AdminTexterList from './containers/AdminTexterList'
import AdminOptOutList from './containers/AdminOptOutList'
import AdminCampaignEdit from './containers/AdminCampaignEdit'
import TexterDashboard from './components/TexterDashboard'
import TopNav from './components/TopNav'
import DashboardLoader from './containers/DashboardLoader'
import TexterTodoList from './containers/TexterTodoList'
import TexterTodo from './containers/TexterTodo'
import Login from './components/Login'
import React from 'react'
import CreateOrganization from './containers/CreateOrganization'
import JoinTeam from './containers/JoinTeam'
import Home from './containers/Home'

export default function makeRoutes(requireAuth = () => {}) {
  return (
    <Route path='/' component={App}>
      <IndexRoute component={Home} />
      <Route path='admin' component={AdminDashboard} onEnter={requireAuth}>
        <IndexRoute component={() => <DashboardLoader path='/admin' />} />
        <Route path=':organizationId'>
          <IndexRedirect to='campaigns' />
          <Route path='campaigns'>
            <IndexRoute component={AdminCampaignList} />
            <Route path=':campaignId'>
              <IndexRoute component={AdminCampaignStats} />
              <Route path='edit' component={AdminCampaignEdit} />
            </Route>
          </Route>
          <Route path='texters' component={AdminTexterList} />
          <Route path='optouts' component={AdminOptOutList} />
        </Route>
      </Route>
      <Route path='app' component={TexterDashboard} onEnter={requireAuth}>
        <IndexRoute components={{main: () => <DashboardLoader path='/app' />, topNav: () => <TopNav title="Spoke Texting" />}} />
        <Route path=':organizationId'>
          <IndexRedirect to='todos' />
          <Route path='todos'>
            <IndexRoute
              components={{
                main: TexterTodoList,
                topNav: () => <TopNav title="Spoke Texting" />
              }}
            />
            <Route path=':assignmentId'>
              <Route
                path='text'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} contactFilter="needsMessage" />
                }}
              />
              <Route
                path='reply'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} contactFilter="needsResponse" />,
                  topNav: null
                }}
              />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path='login' component={Login} />
      <Route path='invite/:inviteId' component={CreateOrganization} onEnter={requireAuth} />
      <Route path=':organizationId/join' component={JoinTeam} onEnter={requireAuth} />
    </Route>
  )
}
