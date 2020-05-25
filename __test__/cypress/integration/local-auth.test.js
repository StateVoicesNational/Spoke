// Disable this test if running against auth0
describe("Login with the local passport strategy", () => {
  const ts = new Date().getTime();

  beforeEach(() => {
    // TODO: create an invite in the test organization so that this works
    // even when SUPPRESS_SELF_INVITE is turned off
    cy.visit("/");
  });

  it("Sign up", () => {
    cy.get("#login").click();
    cy.get("button[name='signup']").click();
    cy.get("input[name='email']").type(`spoke.itest.${ts}@example.com`);
    cy.get("input[name='firstName']").type("SignupTestUserFirst");
    cy.get("input[name='lastName']").type("SignupTestUserLast");
    cy.get("input[name='cell']").type("5555551234");
    cy.get("input[name='password']").type("SignupTestUser1!", { delay: 10 });
    cy.get("input[name='passwordConfirm']").type("SignupTestUser1!", {
      delay: 10
    });
    cy.get("[data-test=userEditForm]").submit();
    // The next page is different depending on whether SUPPRESS_SELF_INVITE is
    // set, so we just assert that we are not still on the login page
    // the wait is required because cypress doesn't know how long to wait for the url to change
    cy.wait(500);
    cy.url().then(url => expect(url).not.to.match(/.*login.*/));
  });

  // sign in as the user
  it("Sign in", () => {
    cy.get("#login").click();
    cy.get("input[name='email']").type(`spoke.itest.${ts}@example.com`);
    cy.get("input[name='password']").type("SignupTestUser1!", { delay: 10 });
    cy.get("[data-test=userEditForm]").submit();
    cy.wait(500);
    cy.url().then(url => expect(url).not.to.match(/.*login.*/));
  });
});
