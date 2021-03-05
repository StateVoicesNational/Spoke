describe("End-to-end campaign flow", () => {
  const adminInfo = { email: "admin@example.com", password: "Admin1!" };
  const texterInfo = {
    email: "texter@example.com",
    password: "Texter1!",
    first_name: "TexterFirst",
    last_name: "TexterLast"
  };
  let admin = null;
  let texter = null;

  beforeEach(() => {
    cy.task("createOrganization").then(org => {
      // Admin creates a campaign and assigns contacts to the texter
      cy.task("createUser", {
        userInfo: adminInfo,
        org,
        role: "OWNER"
      }).then(user => (admin = user));
      cy.task("createUser", {
        userInfo: texterInfo,
        org,
        role: "TEXTER"
      }).then(user => (texter = user));
    });
  });

  it("with an assigned texter", () => {
    // ADMIN
    const campaignTitle = "Integration Test Campaign";
    const campaignDescription = "Basic campaign with assignments";

    cy.login(admin);
    cy.visit("/");
    cy.get("button[data-test=addCampaign]").click();

    // Fill out basics
    cy.get("input[data-test=title]").type(campaignTitle);
    cy.get("input[data-test=description]").type(campaignDescription);

    // DatePicker is difficult to interact with as its components have no ids or classes
    // Selectors are fairly brittle, consider upgrading material-ui for easier test interaction

    // Open picker by focusing input
    cy.get("input[data-test=dueBy]").click();
    // Click next month (>)
    cy.get("body > div:nth-of-type(2) button:nth-of-type(2)")
      .first()
      .click();
    // Click first of the month
    cy.get("body > div:nth-of-type(2) button:not([disabled])")
      .eq(3)
      .click();

    // Wait for modal to close then submit
    // TODO: use cy.waitUntil() instead of wait()
    cy.wait(400);
    cy.get("[data-test=campaignBasicsForm] button").submit();

    // Upload Contacts
    cy.get("#contact-upload").attachFile("two-contacts.csv"), { force: true };
    cy.get("button[data-test=submitContactsCsvUpload]")
      .first()
      .click();

    // Assignments
    // Note: Material UI v0 AutoComplete component appears to require a click on the element
    // later versions should just allow you to hit enter
    cy.get("input[data-test=texterSearch]").type("Texter");
    // see if there is a better way to select the search result
    cy.get("body")
      .contains(`${texter.first_name} ${texter.last_name}`)
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

    // Login as TEXTER and send messages to contacts
    cy.url().then(url => {
      const campaignId = url.match(/campaigns\/(\d+)/)[1];
      cy.login(texter);
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
      cy.get("textArea[name=messageText]").then(el => {
        expect(el.text()).to.match(
          /Hi ContactFirst(\d) this is TexterFirst, how are you\?/
        );
      });

      cy.get("button[data-test=send]").click();
      // Message next contact
      cy.wait(200);
      cy.get("textArea[name=messageText]").then(el => {
        expect(el.text()).to.match(
          /Hi ContactFirst(\d) this is TexterFirst, how are you\?/
        );
      });
      cy.get("button[data-test=send]").click();

      // Shows we're done and click back to /todos
      cy.get("body").contains("You've messaged all your assigned contacts.");
      cy.get("button:contains(Back To Todos)").click();
      cy.waitUntil(() => cy.url().then(url => url.match(/\/todos$/)));
    });
  });
});
