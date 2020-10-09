// See https://docs.cypress.io/api/cypress-api/custom-commands.html#Syntax
import "cypress-file-upload";
import "cypress-wait-until";

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
