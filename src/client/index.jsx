import React from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { StyleSheet } from "aphrodite";
import errorCatcher from "./error-catcher";
import makeRoutes from "../routes";
import { ApolloProvider } from "react-apollo";
import ApolloClientSingleton from "../network/apollo-client-singleton";
import { login, logout } from "./auth-service";

window.onerror = (msg, file, line, col, error) => {
  errorCatcher(error);
};
window.addEventListener("unhandledrejection", event => {
  errorCatcher(event.reason);
});
window.AuthService = {
  login,
  logout
};

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

ReactDOM.render(
  <ApolloProvider client={ApolloClientSingleton}>
    <Router history={browserHistory} routes={makeRoutes()} />
  </ApolloProvider>,
  document.getElementById("mount")
);
