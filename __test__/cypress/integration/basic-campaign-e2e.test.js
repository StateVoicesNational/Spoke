import TestData from "../fixtures/test-data";

describe("End-to-end campaign flow", () => {
  before(() => {
    // ensure texter one exists so they can be assigned
    cy.task("createOrUpdateUser", TestData.users.texter1);
  });

  it("with an assigned texter", () => {
    // ADMIN
    const campaignTitle = `E2E basic flow ${new Date().getTime()}`;
    const campaignDescription = "Basic campaign with assignments";

    cy.login("admin1");
    cy.visit("/");
    cy.get("button[data-test=addCampaign]").click();

    // Fill out basics
    cy.get("input[data-test=title]").type(campaignTitle);
    cy.get("input[data-test=description]").type(campaignDescription);
    cy.get("input[data-test=dueBy]").click();

    // Very brittle DatePicker interaction to pick the first day of the next month
    // Note: newer versions of Material UI appear to have better hooks for integration
    // testing.
    cy.get(
      "body > div:nth-child(5) > div > div:nth-child(1) > div > div > div > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > button:nth-child(3)"
    ).click();
    cy.get("button")
      .contains("1")
      .click();

    // wait for modal to get dismissed, maybe use https://www.npmjs.com/package/cypress-wait-until
    cy.wait(500);
    cy.get("[data-test=campaignBasicsForm]").submit();

    // Upload Contacts
    cy.get("#contact-upload").attachFile("two-contacts.csv");
    cy.get("button[data-test=submitContactsCsvUpload]").click();

    // Assignments
    // Note: Material UI v0 AutoComplete component appears to require a click on the element
    // later versions should just allow you to hit enter
    cy.get("input[data-test=texterSearch]").type("Texter1First");
    // see if there is a better way to select the search result
    cy.get("body")
      .contains("Texter1First Texter1Last")
      .click();
    cy.get("input[data-test=autoSplit]").click();
    cy.get("button[data-test=submitCampaignTextersForm]").click();

    // Interaction Steps
    cy.get("textarea[data-test=editorInteraction]").click();
    cy.get(".DraftEditor-root").type(
      "Hi {{}firstName{}} this is {{}texterFirstName{}}, how are you?"
    );
    cy.get("button[data-test=scriptDone]").click();
    cy.get("input[data-test=questionText]").type("How are you?");
    cy.get("button[data-test=addResponse]").click();
    cy.get("input[data-test=answerOption]").type("Good");
    cy.get("textarea[data-test=editorInteraction]")
      .eq(1)
      .click();
    cy.get(".DraftEditor-root").type("Great!");
    cy.get("button[data-test=scriptDone]").click();
    cy.get("button[data-test=interactionSubmit]").click();
    cy.get("button[data-test=startCampaign]").click();
    cy.get("div")
      .contains("This campaign is running")
      .should("exist");

    cy.url().then(url => {
      const campaignId = url.match(/campaigns\/(\d+)/)[1];
      // TEXTER
      cy.login("texter1");
      cy.visit("/app");
      const cardSelector = `div[data-test=assignmentSummary-${campaignId}]`;
      cy.get(cardSelector)
        .contains(campaignTitle)
        .should("exist");
      cy.get(cardSelector)
        .contains(campaignDescription)
        .should("exist");
      cy.get(cardSelector)
        .find("button[data-test=sendFirstTexts]")
        .click();
      // TODO: handle when order of contacts is reversed
      cy.get("textArea[name=messageText]").then(el => {
        expect(el).to.have.text(
          "Hi Contactfirst1 this is Texter1first, how are you?"
        );
      });

      if (Cypress.env("DEFAULT_SERVICE") === "fakeservice") {
        cy.get("button[data-test=send]").click();
        // wait advance to next contact
        cy.wait(200);
        cy.get("textArea[name=messageText]").then(el => {
          expect(el).to.have.text(
            "Hi Contactfirst2 this is Texter1first, how are you?"
          );
        });
        cy.get("button[data-test=send]").click();
        // Go back to TODOS
        cy.wait(200);
        cy.url().should("include", "/todos");
      }
    });
  });
});
