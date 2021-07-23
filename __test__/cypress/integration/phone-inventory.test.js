if (Cypress.env("DEFAULT_SERVICE") === "fakeservice") {
  describe("Phone number management screen in the Admin interface", () => {
    const testAreaCode = "212";

    beforeEach(() => {
      cy.login("admin1");
      cy.visit("/");
      cy.task("clearTestOrgPhoneNumbers", testAreaCode);
    });

    it("shows numbers by area code and allows OWNERs to buy more", () => {
      cy.get("[data-test=navPhoneNumbers]").click();
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

      // Skip testing pending jobs logic now. Just refresh the page
      // and check that we have one number available
      cy.wait(200);
      cy.reload();

      // "Available" column of the row containing the test areaCode
      cy.get(`tr:contains(${testAreaCode}) td:nth-child(3)`).then(td => {
        expect(td).to.have.text("1");
      });
    });
  });
} else {
  describe(`When running against ${Cypress.env("DEFAULT_SERVICE")}`, () => {
    it.skip("tests skipped");
  });
}
