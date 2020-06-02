import testData from "../fixtures/test-data";

describe("The user edit screen", () => {
  beforeEach(() => {
    cy.login("admin1");
    cy.visit("/");
  });

  it("displays the current user's and allows them to edit it", () => {
    const userDetails = testData.users.admin1;
    cy.get("[data-test=userMenuButton]").click();
    cy.get("[data-test=userMenuDisplayName]").click();
    cy.get("input[data-test=email]").should("have.value", userDetails.email);
    cy.get("input[data-test=firstName]").should(
      "have.value",
      userDetails.first_name
    );
    cy.get("input[data-test=lastName]").should(
      "have.value",
      userDetails.last_name
    );
    cy.get("input[data-test=alias]").should("have.value", "");
    cy.get("input[data-test=cell]").should("have.value", userDetails.cell);

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

    // revert to previous values so this doesn't interfere with other tests
    // TODO: it would be better to create a new user for this
    cy.get("input[data-test=firstName]").type(userDetails.first_name);
    cy.get("input[data-test=lastName]").type(userDetails.last_name);
    cy.get("input[data-test=alias]").type("{backspace}");
    cy.get("[data-test=userEditForm]").submit();
  });
});
