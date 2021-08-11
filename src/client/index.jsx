import { AppContainer } from "react-hot-loader";
import React from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { StyleSheet } from "aphrodite";
import errorCatcher from "./error-catcher";
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

const renderApp = () => {
  const makeRoutes = require("../routes").default;
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider client={ApolloClientSingleton}>
          <Router history={browserHistory} routes={makeRoutes()} />
      </ApolloProvider>
    </AppContainer>,
    document.getElementById("mount")
  );
};

if (module && module.hot && module.hot.accept) {
  module.hot.accept("../routes", () => renderApp());
}

renderApp();