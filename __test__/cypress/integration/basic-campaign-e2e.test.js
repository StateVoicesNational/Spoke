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
    cy.get("[data-test=title] input").type(campaignTitle);
    cy.get("[data-test=description] input").type(campaignDescription);

    // DatePicker is difficult to interact with as its components have no ids or classes
    // Selectors are fairly brittle, consider upgrading material-ui for easier test interaction

    // Open picker by focusing input
    cy.get("[data-test=dueBy] input").type("1");
    // Click next month (>)
    cy.get("div.MuiPickersCalendarHeader-switchHeader > button:nth-child(3)")
      .first()
      .click();
    cy.task("log", "cyLOG basic-campaign-e2e-test 1");
    // Click first of the month
    cy.get(".MuiPickersCalendar-week button:not(.MuiPickersDay-hidden)")
      .eq(3)
      .click();
    cy.task("log", "cyLOG basic-campaign-e2e-test 2");
    // Click okay on calendar
    /*
    cy.get(".MuiDialogActions-root button")
      .eq(1)
      .click();
    */
    cy.task("log", "cyLOG basic-campaign-e2e-test 3");
    // Wait for modal to close then submit
    // TODO: use cy.waitUntil() instead of wait()
    cy.wait(400);
    cy.get("[data-test=campaignBasicsForm]").submit();
    cy.task("log", "cyLOG basic-campaign-e2e-test 4");
    // Upload Contacts
    cy.get("#contact-upload").attachFile("two-contacts-broken.csv"),
      { force: true };
    cy.wait(400);
    cy.get("#contact-upload").attachFile("three-contacts.csv"), { force: true };
    cy.wait(400);
    cy.get("#contact-upload").attachFile("three-contacts.csv"), { force: true };
    cy.wait(400);
    cy.get("#contact-upload").attachFile("csv-headers-test.csv"),
      { force: true };
    cy.wait(400);
    cy.get("#contact-upload").attachFile("two-contacts.csv"), { force: true };
    cy.wait(400);
    cy.get("button[data-test=submitContactsCsvUpload]").click();
    cy.task("log", "cyLOG basic-campaign-e2e-test 5");
    // Assignments
    // Note: Material UI v0 AutoComplete component appears to require a click on the element
    // later versions should just allow you to hit enter
    cy.get("[data-test=texterSearch] input").type("Texter");
    // see if there is a better way to select the search result
    cy.get("body")
      .contains(`${texter.first_name} ${texter.last_name}`)
      .click();
    cy.get("[data-test=autoSplit] input").click();
    cy.wait(400);
    cy.get("button[data-test=submitCampaignTextersForm]").click({
      force: true
    });
    cy.wait(400);

    // Interaction Steps
    // the editorInteraction selector might seem overly precise
    // -- the problem is that multiline fields have two textareas, one hidden
    cy.get("[data-test=editorInteraction] textarea[name=script]").click();
    cy.wait(400);
    cy.get(".DraftEditor-root").type(
      "Hi {{}firstName{}} this is {{}texterAliasOrFirstName{}}, how are you?"
    );
    cy.get("button[data-test=scriptDone]").click();
    cy.get("[data-test=questionText] input").type("How are you?");
    cy.get("button[data-test=addResponse]").click();
    cy.get("[data-test=answerOption] input").type("Good");
    cy.get("[data-test=editorInteraction] textarea[name=script]")
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
      cy.get("[name=messageText]").then(els => {
        console.log("name=messageText", els[0]);
        expect(els[0].value).to.match(
          /Hi ContactFirst(\d) this is TexterFirst, how are you\?/
        );
      });
      cy.task("log", "cyLOG basic-campaign-e2e-test 6");
      cy.get("button[data-test=send]")
        .eq(0)
        .click();
      // Message next contact
      cy.wait(200);
      cy.get("[name=messageText]").then(els => {
        expect(els[0].value).to.match(
          /Hi ContactFirst(\d) this is TexterFirst, how are you\?/
        );
      });
      cy.get("button[data-test=send]")
        .eq(0)
        .click({ waitForAnimations: false }); // Turn off animation wait to prevent false positive error

      // Shows we're done and click back to /todos
      cy.get("body").contains("You've messaged all your assigned contacts.");
      cy.task("log", "cyLOG basic-campaign-e2e-test 7");
      cy.get("button:contains(Back To Todos)").click();
      cy.task("log", "cyLOG basic-campaign-e2e-test 8");
      cy.waitUntil(() => cy.url().then(url => url.match(/\/todos$/)));
    });
  });
});
