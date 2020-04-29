// support/index.js is processed and loaded automatically before your test files.
// this runs in the browser is a good place to define common cypress operations
import "cypress-file-upload";

import TestData from "../fixtures/test-data";

// TODO: support Auth0
Cypress.Commands.add("login", testDataId => {
  const userData = TestData.users[testDataId];
  if (!userData) {
    throw Error(`Unknown test user ${testDataId}`);
  }

  cy.task("createOrUpdateUser", userData);
  cy.request("POST", "/login-callback", {
    nextUrl: "/",
    authType: "login",
    password: userData.password,
    email: userData.email
  });
});
