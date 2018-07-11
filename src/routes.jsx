import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
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
import CreateOrganization from './containers/CreateOrganization'
import JoinTeam from './containers/JoinTeam'
import Home from './containers/Home'
import Settings from './containers/Settings'
import UserEdit from './containers/UserEdit'
import TexterFaqs from './components/TexterFaqs'
import FAQs from './lib/faqs'

const AdminCampaignRoutes = ({ match }) => {
  const campaignPath = '/admin/:organizationId/campaigns/:campaignId'
  return (
    <Switch>
      <Route path={campaignPath} exact component={AdminCampaignStats} />
      <Route path={`${campaignPath}/edit`} component={AdminCampaignEdit} />
      <Route path={`${campaignPath}/send-replies`} component={AdminReplySender} />
    </Switch>
  )
}

const AdminCampaignListRoutes = ({ match }) => {
  const lastPath = '/admin/:organizationId/campaigns'
  return (
    <Switch>
      <Route path={lastPath} exact component={AdminCampaignList} />
      <Route path={`${lastPath}/:campaignId`} component={AdminCampaignRoutes} />
    </Switch>
  )
}

const AdminOrganizationRoutes = ({ match }) => {
  const orgPath = '/admin/:organizationId'
  return (
    <Switch>
      <Redirect path={orgPath} exact to={`${match.url}/campaigns`} />
      <Route path={`${orgPath}/campaigns`} component={AdminCampaignListRoutes} />
      <Route path={`${orgPath}/people`} component={AdminPersonList} />
      <Route path={`${orgPath}/optouts`} component={AdminOptOutList} />
      <Route path={`${orgPath}/incoming`} component={AdminIncomingMessageList} />
      <Route path={`${orgPath}/settings`} component={Settings} />
    </Switch>
  )
}

const AdminRoutes = (props) => {
  const { match } = props
  return (
    <AdminDashboard {...props}>
      <Switch>
        <Route path={match.url} exact render={indexMatch => (
          <DashboardLoader path='/admin' {...indexMatch} />
        )} />
        <Route path='/admin/:organizationId' component={AdminOrganizationRoutes} />
      </Switch>
    </AdminDashboard>
  )
}

// TODO: Not sure the best way to deal with props: main, topNav, fullScreen
const TexterRoutes = (props) => {
  const { match } = props
  return (
    <TexterDashboard {...props}>
      <Switch>
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
      </Switch>
    </TexterDashboard>
  )
}

export default function makeRoutes(requireAuth = () => {}) {
  return (
    <Switch>
      <Route path='/' exact component={Home} />
      <Route path='/admin' component={AdminRoutes} onEnter={requireAuth} />
      <Route path='/app' component={TexterRoutes} onEnter={requireAuth} />
      <Route path='/login' component={Login} />
      <Route path='/terms' component={Terms} />
      <Route path='/invite/:inviteId' component={CreateOrganization} onEnter={requireAuth} />
      <Route path='/:organizationUuid/join/:campaignId' component={JoinTeam} onEnter={requireAuth} />
      <Route path='/:organizationUuid/join' component={JoinTeam} onEnter={requireAuth} />
    </Switch>
  )
}
