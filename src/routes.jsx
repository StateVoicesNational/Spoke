import { IndexRoute, IndexRedirect, Route } from 'react-router'
import App from './components/App'
import AdminDashboard from './components/AdminDashboard'
import AdminCampaignList from './containers/AdminCampaignList'
import AdminCampaignStats from './containers/AdminCampaignStats'
import AdminPersonList from './containers/AdminPersonList'
import AdminOptOutList from './containers/AdminOptOutList'
import AdminIncomingMessageList from './containers/AdminIncomingMessageList'
import AdminCampaignEdit from './containers/AdminCampaignEdit'
import AdminReplySender from './containers/AdminReplySender'
import TexterDashboard from './components/TexterDashboard'
import TopNav from './components/TopNav'
import DashboardLoader from './containers/DashboardLoader'
import TexterTodoList from './containers/TexterTodoList'
import TexterTodo from './containers/TexterTodo'
import Login from './components/Login'
import Terms from './containers/Terms'
import React from 'react'
import CreateOrganization from './containers/CreateOrganization'
import JoinTeam from './containers/JoinTeam'
import Home from './containers/Home'
import Settings from './containers/Settings'
import UserEdit from './containers/UserEdit'
import TexterFaqs from './components/TexterFaqs'
import FAQs from './lib/faqs'

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
              <Route path='send-replies' component={AdminReplySender} />
            </Route>
          </Route>
          <Route path='people' component={AdminPersonList} />
          <Route path='optouts' component={AdminOptOutList} />
          <Route path='incoming' component={AdminIncomingMessageList} />
          <Route path='settings' component={Settings} />
        </Route>
      </Route>
      <Route path='app' component={TexterDashboard} onEnter={requireAuth}>
        <IndexRoute components={{ main: () => <DashboardLoader path='/app' />,
                                  topNav: (p) => <TopNav title='Spoke Texting' orgId={p.params.organizationId} /> }} />
        <Route path=':organizationId'>
          <IndexRedirect to='todos' />
          <Route path='faqs' components={{
            main: () => <TexterFaqs faqs={FAQs} />,
            topNav: (p) => <TopNav title='Account' orgId={p.params.organizationId} /> }} />
          <Route path='account/:userId' components={{
            main: (p) => <UserEdit userId={p.params.userId} organizationId={p.params.organizationId} />,
            topNav: (p) => <TopNav title='Account' orgId={p.params.organizationId} /> }} />
          <Route path='todos'>
            <IndexRoute
              components={{
                main: TexterTodoList,
                topNav: (p) => <TopNav title='Spoke Texting' orgId={p.params.organizationId} />
              }}
            />
            <Route path=':assignmentId'>
              <Route
                path='text'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} messageStatus='needsMessage' />
                }}
              />
              <Route
                path='reply'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} messageStatus='needsResponse' />,
                  topNav: null
                }}
              />
              <Route
                path='stale'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} messageStatus='convo' />,
                  topNav: null
                }}
              />
              <Route
                path='skipped'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} messageStatus='closed' />,
                  topNav: null
                }}
              />
              <Route
                path='all'
                components={{
                  fullScreen: (props) => <TexterTodo {...props} messageStatus='needsMessageOrResponse' />,
                  topNav: null
                }}
              />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path='login' component={Login} />
      <Route path='terms' component={Terms} />
      <Route path='invite/:inviteId' component={CreateOrganization} onEnter={requireAuth} />
      <Route path=':organizationUuid/join/:campaignId' component={JoinTeam} onEnter={requireAuth} />
      <Route path=':organizationUuid/join' component={JoinTeam} onEnter={requireAuth} />
    </Route>
  )
}
