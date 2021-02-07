describe("Authentication with the local passport strategy", () => {
  // TODO: test with SUPPRESS_SELF_INVITE=true by creating an invite
  describe("With SUPPRESS_SELF_INVITE=false", () => {
    it("Signs a user up", () => {
      cy.visit("/");

      cy.get("#login").click();
      cy.get("button[name='signup']").click();
      cy.get("input[name='email']").type(`SignupTestUser@example.com`);
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
      cy.waitUntil(() => cy.url().then(url => !url.match(/login/)));
    });

    it("Logs a user in", () => {
      let email = "user@example.com";
      let password = "User1!";
      cy.task("createUser", {
        userInfo: { email, password }
      });

      cy.visit("/");
      cy.get("#login").click();

      cy.get("input[name='email']").type(email);
      cy.get("input[name='password']").type(password, { delay: 10 });
      cy.get("[data-test=userEditForm]").submit();
      cy.waitUntil(() => cy.url().then(url => !url.match(/login/)));
    });
  });
});
