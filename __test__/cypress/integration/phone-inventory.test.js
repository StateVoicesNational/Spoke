if (Cypress.env("DEFAULT_SERVICE") === "fakeservice") {
  describe("Phone number management screen in the Admin interface", () => {
    const testAreaCode = "212";

    beforeEach(() => {
      cy.task("clearTestOrgPhoneNumbers", testAreaCode);
      cy.login("admin1");
      cy.visit("/admin/1/phone-numbers");
    });

    it("shows numbers by area code and allows OWNERs to buy more", () => {
      cy.get("th").contains("Area Code");
      cy.get("th").contains("Allocated");
      cy.get("th").contains("Available");
      cy.get("tr")
        .contains(testAreaCode)
        .should("not.exist");

      // Fill out the form to buy a new number
      cy.get("button[data-test=buyPhoneNumbers]").click();
      cy.get("input[data-test=areaCode]").type(testAreaCode);
      cy.get("input[data-test=limit]").type("1");
      cy.get("[data-test=buyNumbersForm]").submit();

      // "Available" column of the row containing the test areaCode
      // Waits until job run completes
      cy.waitUntil(
        () =>
          cy.get(`tr:contains(${testAreaCode}) td:nth-child(4)`).contains("1"),
        { timeout: 1000 }
      );
    });
  });
} else {
  describe(`When running against ${Cypress.env("DEFAULT_SERVICE")}`, () => {
    it.skip("tests skipped");
  });
}
