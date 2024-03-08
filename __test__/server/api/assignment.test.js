import { getContacts } from "../../../src/server/api/assignment";
import { Organization, Assignment, Campaign } from "../../../src/server/models";

jest.mock("../../../src/lib/timezones.js");
var timezones = require("../../../src/lib/timezones.js");

describe("test getContacts builds queries correctly", () => {
  var organization = new Organization({
    texting_hours_enforced: false,
    texting_hours_start: 9,
    texting_hours_end: 14
  });

  var campaign = new Campaign({
    due_by: new Date()
  });

  const past_due_campaign = new Campaign({
    due_by: new Date().setFullYear(new Date().getFullYear() - 1)
  });

  var assignment = new Assignment({
    id: 1
  });

  beforeEach(() => {
    timezones.getOffsets.mockReturnValueOnce([["-5_1"], ["-4_1"]]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("works with: no contacts filter", () => {
    const query = getContacts(assignment, undefined, organization, campaign);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: contacts filter, include past due, message status", () => {
    const query = getContacts(
      assignment,
      { includePastDue: true },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'needsResponse\', \'needsMessage\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: contacts filter, exclude past due, message status needsMessageOrResponse", () => {
    const query = getContacts(
      assignment,
      { messageStatus: "needsMessageOrResponse" },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'needsResponse\', \'needsMessage\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: contacts filter, exclude past due, campaign is past due, message status needsMessage", () => {
    const query = getContacts(
      assignment,
      { messageStatus: "needsMessage" },
      organization,
      past_due_campaign
    );
    // this should be empty because the query is empty and thus we return []
    expect(query.toString()).toBe("");
  }); // it

  it("works with: contacts filter, exclude past due, message status one other", () => {
    const query = getContacts(
      assignment,
      { messageStatus: "convo" },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'convo\'\) order by message_status DESC, updated_at DESC/
    );
  }); // it

  it("works with: contacts filter, exclude past due, message status multiple other", () => {
    const query = getContacts(
      assignment,
      { messageStatus: "convo,messageReceived" },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'convo\', \'messageReceived\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: contacts filter, exclude past due, no message status, campaign is past due", () => {
    const query = getContacts(assignment, {}, organization, past_due_campaign);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'needsResponse\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: contacts filter, exclude past due, no message status, campaign not past due", () => {
    const query = getContacts(assignment, {}, organization, campaign);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'needsResponse\', \'needsMessage\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("works with: forCount, contacts filter, exclude past due, no message status, campaign not past due", () => {
    const query = getContacts(assignment, {}, organization, campaign, true);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .message_status. in \(\'needsResponse\', \'needsMessage\'\)/
    );
  }); // it
}); // describe

describe("test getContacts timezone stuff only", () => {
  var organization = new Organization({
    texting_hours_enforced: true,
    texting_hours_start: 9,
    texting_hours_end: 14
  });

  var campaign = new Campaign({
    due_by: new Date()
  });

  var assignment = new Assignment({
    id: 1
  });

  beforeEach(() => {
    timezones.getOffsets.mockReturnValueOnce([["-5_1"], ["-4_1"]]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("returns the correct query -- in default texting hours, with valid_timezone == true", () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(true);
    var query = getContacts(
      assignment,
      { validTimezone: true },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .timezone_offset. in \('-5_1', ''\) and .message_status. in \('needsResponse', 'needsMessage'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("returns the correct query -- in default texting hours, with valid_timezone == false", () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(true);
    var query = getContacts(
      assignment,
      { validTimezone: false },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .timezone_offset. in \(\'-4_1\'\) and .message_status. in \(\'needsResponse\', \'needsMessage\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("returns the correct query -- NOT in default texting hours, with valid_timezone == true", () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false);
    var query = getContacts(
      assignment,
      { validTimezone: true },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .timezone_offset. in \(\'-5_1\'\) and .message_status. in \(\'needsResponse\', \'needsMessage\'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("returns the correct query -- NOT in default texting hours, with valid_timezone == false", () => {
    timezones.defaultTimezoneIsBetweenTextingHours.mockReturnValueOnce(false);
    var query = getContacts(
      assignment,
      { validTimezone: false },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1 and .timezone_offset. in \('-4_1', ''\) and .message_status. in \('needsResponse', 'needsMessage'\) order by message_status DESC, updated_at/
    );
  }); // it

  it("returns the correct query -- no contacts filter", () => {
    var query = getContacts(assignment, null, organization, campaign);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1.*/
    );
  }); // it

  it("returns the correct query -- no validTimezone property in contacts filter", () => {
    var query = getContacts(assignment, {}, organization, campaign);
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1.*/
    );
  }); // it

  it("returns the correct query -- validTimezone property is null", () => {
    var query = getContacts(
      assignment,
      { validTimezone: null },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1.*/
    );
  }); // it

  it("returns the correct query -- assignment load limit not set", () => {
    let query = getContacts(
      assignment,
      { validTimezone: null },
      organization,
      campaign
    );
    expect(query.toString()).not.toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1.* limit 1/
    );
  }); // it

  it("returns the correct query -- assignment load limit set", () => {
    global["ASSIGNMENT_LOAD_LIMIT"] = 1;
    let query = getContacts(
      assignment,
      { validTimezone: null },
      organization,
      campaign
    );
    expect(query.toString()).toMatch(
      /^select \* from .campaign_contact. where .assignment_id. = 1.* limit 1/
    );
  }); // it
}); // describe
