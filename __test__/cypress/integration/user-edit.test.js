describe("The user edit screen", () => {
  const adminInfo = { email: "admin@example.com", password: "Admin1!" };
  let admin = null;

  beforeEach(() => {
    cy.task("createOrganization").then(org => {
      cy.task("createUser", {
        userInfo: adminInfo,
        org,
        role: "OWNER"
      }).then(user => (admin = user));
    });
  });

  it("displays the current user's and allows them to edit it", () => {
    cy.login(admin);
    cy.visit("/");

    cy.get("[data-test=userMenuButton]").click();
    cy.get("[data-test=userMenuDisplayName]").click();
    cy.get("[data-test=email] input").should("have.value", admin.email);
    cy.get("[data-test=firstName] input").should(
      "have.value",
      admin.first_name
    );
    cy.get("[data-test=lastName] input").should("have.value", admin.last_name);
    cy.get("[data-test=alias] input").should("have.value", "");
    cy.get("[data-test=cell] input").should("have.value", admin.cell);

    cy.get("[data-test=firstName] input").type("NewAdminFirstName");
    cy.get("[data-test=lastName] input").type("NewAdminLastName");
    cy.get("[data-test=alias] input").type("NewAlias");
    cy.get("[data-test=userEditForm]").submit();

    cy.reload();
    cy.get("[data-test=firstName] input").should(
      "have.value",
      "NewAdminFirstName"
    );
    cy.get("[data-test=lastName] input").should(
      "have.value",
      "NewAdminLastName"
    );
    cy.get("[data-test=alias] input").should("have.value", "NewAlias");
  });
});
