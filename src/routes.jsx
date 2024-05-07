import { IndexRoute, IndexRedirect, Route } from "react-router";
import App from "./components/App";
import AdminDashboard from "./components/AdminDashboard";
import AdminCampaignList from "./containers/AdminCampaignList";
import AdminCampaignStats from "./containers/AdminCampaignStats";
import AdminPersonList from "./containers/AdminPersonList";
import AdminIncomingMessageList from "./containers/AdminIncomingMessageList";
import AdminCampaignEdit from "./containers/AdminCampaignEdit";
import AdminReplySender from "./containers/AdminReplySender";
import AdminCampaignMessagingService from "./containers/AdminCampaignMessagingService";
import AdminBulkScriptEditor from "./containers/AdminBulkScriptEditor";
import TexterDashboard from "./components/TexterDashboard";
import OrganizationWrapper from "./components/OrganizationWrapper";
import TopNav from "./components/TopNav";
import DashboardLoader from "./containers/DashboardLoader";
import TexterTodoList from "./containers/TexterTodoList";
import TexterTodo from "./containers/TexterTodo";
import Login from "./components/Login";
import Terms from "./containers/Terms";
import Downtime from "./components/Downtime";
import React from "react";
import CreateOrganization from "./containers/CreateOrganization";
import CreateAdditionalOrganization from "./containers/CreateAdditionalOrganization";
import AdminOrganizationsDashboard from "./containers/AdminOrganizationsDashboard";
import JoinTeam from "./containers/JoinTeam";
import AssignReplies from "./containers/AssignReplies";
import Home from "./containers/Home";
import Settings from "./containers/Settings";
import Tags from "./containers/Tags";
import UserEdit from "./containers/UserEdit";
import TexterFaqs from "./components/TexterFrequentlyAskedQuestions";
import FAQs from "./lib/faqs";
import {
  DemoTexterNeedsMessage,
  DemoTexterNeedsResponse,
  DemoTexter2ndQuestion,
  DemoTexterDynAssign,
  tests
} from "./components/AssignmentTexter/Demo";
import AssignmentSummary from "./components/AssignmentSummary";
import AdminPhoneNumberInventory from "./containers/AdminPhoneNumberInventory";

const checkDowntime = (nextState, replace) => {
  if (global.DOWNTIME && nextState.location.pathname !== "/downtime") {
    replace({
      pathname: "/downtime"
    });
  }
};

const checkTexterDowntime = requireAuth => (nextState, replace) => {
  if (global.DOWNTIME_TEXTER && nextState.location.pathname !== "/downtime") {
    replace({
      pathname: "/downtime"
    });
  } else {
    return requireAuth(nextState, replace);
  }
};

export default function makeRoutes(requireAuth = () => {}) {
  return (
    <Route path="/" component={App} onEnter={checkDowntime}>
      <IndexRoute component={Home} />
      <Route path="downtime" component={Downtime} />
      <Route path="admin" component={AdminDashboard} onEnter={requireAuth}>
        <IndexRoute component={() => <DashboardLoader path="/admin" />} />
        <Route path=":organizationId" component={OrganizationWrapper}>
          <IndexRedirect to="campaigns" />
          <Route path="campaigns">
            <IndexRoute component={AdminCampaignList} />
            <Route path=":campaignId">
              <IndexRoute component={AdminCampaignStats} />
              <Route path="edit" component={AdminCampaignEdit} />
              <Route path="send-replies" component={AdminReplySender} />
              <Route
                path="messaging-service"
                component={AdminCampaignMessagingService}
              />
            </Route>
          </Route>
          <Route path="people" component={AdminPersonList} />
          <Route path="incoming" component={AdminIncomingMessageList} />
          <Route path="bulk-script-editor" component={AdminBulkScriptEditor} />
          <Route path="tags" component={Tags} />
          <Route path="settings" component={Settings} />
          <Route path="phone-numbers" component={AdminPhoneNumberInventory} />
        </Route>
      </Route>
      <Route path="app" onEnter={checkTexterDowntime(requireAuth)}>
        <IndexRoute
          component={props => {
            return (
              <TexterDashboard
                main={<DashboardLoader path="/app" />}
                topNav={
                  <TopNav
                    title="Spoke Texting"
                    orgId={props.params.organizationId}
                  />
                }
              />
            );
          }}
        />
        <Route path=":organizationId" component={OrganizationWrapper}>
          <IndexRedirect to="todos" />
          <Route
            path="faqs"
            component={props => {
              return (
                <TexterDashboard
                  main={<TexterFaqs faqs={FAQs} />}
                  topNav={
                    <TopNav
                      title="Account"
                      orgId={props.params.organizationId}
                    />
                  }
                />
              );
            }}
          />
          <Route
            path="account/:userId"
            component={props => {
              return (
                <TexterDashboard
                  main={
                    <UserEdit
                      userId={props.params.userId}
                      organizationId={props.params.organizationId}
                    />
                  }
                  topNav={
                    <TopNav
                      title="Account"
                      orgId={props.params.organizationId}
                    />
                  }
                />
              );
            }}
          />
          <Route path="todos">
            <IndexRoute
              component={props => {
                return (
                  <TexterDashboard
                    main={<TexterTodoList {...props} />}
                    topNav={
                      <TopNav
                        title="Spoke Texting"
                        orgId={props.params.organizationId}
                      />
                    }
                  />
                );
              }}
            />
            <Route
              path="other/:userId"
              component={props => {
                return (
                  <TexterDashboard
                    main={<TexterTodoList {...props} />}
                    topNav={
                      <TopNav
                        title="Spoke Texting"
                        orgId={props.params.organizationId}
                      />
                    }
                  />
                );
              }}
            />
            <Route
              path="review/:reviewContactId"
              component={props => {
                return (
                  <TexterDashboard fullScreen={<TexterTodo {...props} />} />
                );
              }}
            />
            <Route path=":assignmentId">
              <Route
                path="text"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo {...props} messageStatus="needsMessage" />
                      }
                    />
                  );
                }}
              />
              <Route
                path="reply"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo {...props} messageStatus="needsResponse" />
                      }
                    />
                  );
                }}
              />
              <Route
                path="stale"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo {...props} messageStatus="convo" />
                      }
                    />
                  );
                }}
              />
              <Route
                path="skipped"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo {...props} messageStatus="closed" />
                      }
                    />
                  );
                }}
              />
              <Route
                path="allreplies"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo {...props} messageStatus="allReplies" />
                      }
                    />
                  );
                }}
              />
              <Route
                path="all"
                component={props => {
                  return (
                    <TexterDashboard
                      fullScreen={
                        <TexterTodo
                          {...props}
                          messageStatus="needsMessageOrResponse"
                        />
                      }
                    />
                  );
                }}
              />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="login" component={Login} />
      <Route path="organizations" component={AdminOrganizationsDashboard} />
      <Route path="terms" component={Terms} />
      <Route path="reset/:resetHash" component={Home} onEnter={requireAuth} />
      <Route
        path="invite/:inviteId"
        component={CreateOrganization}
        onEnter={requireAuth}
      />
      <Route
        path="addOrganization/:inviteId"
        component={CreateAdditionalOrganization}
        onEnter={requireAuth}
      />
      <Route
        path=":joinToken/replies/:campaignId"
        component={AssignReplies}
        onEnter={requireAuth}
      />
      <Route
        path=":organizationUuid/join/:campaignId"
        component={JoinTeam}
        onEnter={requireAuth}
      />
      <Route
        path=":organizationUuid/join"
        component={JoinTeam}
        onEnter={requireAuth}
      />
      <Route path="demo" component={TexterDashboard}>
        <Route
          path="text"
          components={{
            main: props => <DemoTexterNeedsMessage {...props} />,
            topNav: null
          }}
        />
        <Route
          path="reply"
          components={{
            main: props => <DemoTexterNeedsResponse {...props} />,
            topNav: null
          }}
        />
        <Route
          path="reply2"
          components={{
            main: props => <DemoTexter2ndQuestion {...props} />,
            topNav: null
          }}
        />
        <Route
          path="dyn"
          components={{
            main: props => <DemoTexterDynAssign {...props} />,
            topNav: null
          }}
        />
        <Route
          path="todos"
          components={{
            main: props => <AssignmentSummary {...tests("todos1")} />,
            topNav: p => <TopNav title="Spoke Texting Demo" orgId={"fake"} />
          }}
        />
        <Route
          path="todos2"
          components={{
            main: props => <AssignmentSummary {...tests("todos2")} />,
            topNav: p => <TopNav title="Spoke Texting Demo2" orgId={"fake"} />
          }}
        />
      </Route>
    </Route>
  );
}
