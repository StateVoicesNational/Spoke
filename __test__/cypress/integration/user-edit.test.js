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
    cy.get("input[data-test=email]").should("have.value", admin.email);
    cy.get("input[data-test=firstName]").should("have.value", admin.first_name);
    cy.get("input[data-test=lastName]").should("have.value", admin.last_name);
    cy.get("input[data-test=alias]").should("have.value", "");
    cy.get("input[data-test=cell]").should("have.value", admin.cell);

    cy.get("input[data-test=firstName]").type("NewAdminFirstName");
    cy.get("input[data-test=lastName]").type("NewAdminLastName");
    cy.get("input[data-test=alias]").type("NewAlias");
    cy.get("[data-test=userEditForm]").submit();

    cy.reload();
    cy.get("input[data-test=firstName]").should(
      "have.value",
      "NewAdminFirstName"
    );
    cy.get("input[data-test=lastName]").should(
      "have.value",
      "NewAdminLastName"
    );
    cy.get("input[data-test=alias]").should("have.value", "NewAlias");
  });
});
