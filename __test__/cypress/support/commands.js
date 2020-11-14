// See https://docs.cypress.io/api/cypress-api/custom-commands.html#Syntax
import "cypress-file-upload";
import "cypress-wait-until";

Cypress.Commands.add("login", userData => {
  cy.request("POST", "/login-callback", {
    nextUrl: "/",
    authType: "login",
    password: userData.password,
    email: userData.email
  });
});
