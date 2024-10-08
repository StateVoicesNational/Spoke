/**
 * @jest-environment jsdom
 */
import React from "react";
import moment from "moment-timezone";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import { AssignmentTexterContact } from "../../src/containers/AssignmentTexterContact";
import { muiTheme } from "../test_helpers";
import ThemeContext from "../../src/containers/context/ThemeContext";

import * as timezones from "../../src/lib/timezones";

const MockDate = require("mockdate");

jest.useFakeTimers();

const campaign = {
  id: 9,
  isArchived: false,
  useDynamicAssignment: null,
  organization: {
    id: 2,
    textingHoursEnforced: true,
    textingHoursStart: 8,
    textingHoursEnd: 21
  },
  customFields: [],
  texterUIConfig: {
    sideboxChoices: [],
    options: "{}"
  },
  cannedResponses: [],
  interactionSteps: [
    {
      id: 11,
      question: {
        text: "",
        answerOptions: []
      }
    }
  ]
};

const propsWithEnforcedTextingHoursCampaign = {
  texter: {
    id: 2,
    firstName: "larry",
    lastName: "person",
    assignedCell: null
  },
  campaign,
  assignment: {
    id: 9,
    texter: {
      id: 2,
      firstName: "larry",
      lastName: "person",
      assignedCell: null
    },
    campaign,
    contacts: [
      {
        id: 19
      },
      {
        id: 20
      }
    ],
    allContactsCount: 2
  },
  refreshData: jest.fn(),
  contact: {
    id: 19,
    assignmentId: 9,
    firstName: "larry",
    lastName: "person",
    cell: "+19734779697",
    zip: "10025",
    customFields: "{}",
    optOut: null,
    currentInteractionStepScript: "{firstName}",
    questionResponseValues: [],
    location: {
      city: "New York",
      state: "NY",
      timezone: {
        offset: -5,
        hasDST: true
      }
    },
    messageStatus: "needsMessage",
    messages: []
  },
  navigationToolbarChildren: {
    onNext: jest.fn(),
    onPrevious: jest.fn(),
    title: "1 of 2",
    total: 2,
    currentIndex: 1
  },
  location: { query: {} }
};

describe("when contact is not within texting hours...", () => {
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset();
  });

  it("it refreshes data in componentDidMount", () => {
    jest.spyOn(timezones, "isBetweenTextingHours").mockReturnValue(false);
    jest.spyOn(timezones, "getLocalTime").mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
    StyleSheetTestUtils.suppressStyleInjection();
    let component = mount(
      <ThemeContext.Provider value={{ muiTheme }}>
        <AssignmentTexterContact
          mutations={{}}
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          contact={propsWithEnforcedTextingHoursCampaign.contact}
          navigationToolbarChildren={
            propsWithEnforcedTextingHoursCampaign.navigationToolbarChildren
          }
          location={propsWithEnforcedTextingHoursCampaign.location}
        />
      </ThemeContext.Provider>
    );
    jest.runOnlyPendingTimers();
    expect(
      propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls
    ).toHaveLength(1);
  });
});

describe("when contact is within texting hours...", () => {
  beforeEach(() => {
    jest.spyOn(timezones, "isBetweenTextingHours").mockReturnValue(true);

    jest.spyOn(timezones, "getLocalTime").mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );

    StyleSheetTestUtils.suppressStyleInjection();
    mount(
      <ThemeContext.Provider value={{ muiTheme }}>
        <AssignmentTexterContact
          mutations={{}}
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          contact={propsWithEnforcedTextingHoursCampaign.contact}
          navigationToolbarChildren={
            propsWithEnforcedTextingHoursCampaign.navigationToolbarChildren
          }
          location={propsWithEnforcedTextingHoursCampaign.location}
        />
      </ThemeContext.Provider>
    );
  });
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset();
  });
  it("it does NOT refresh data in componentDidMount", () => {
    jest.runOnlyPendingTimers();
    expect(
      propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls
    ).toHaveLength(0);
  });
});

describe("AssignmentTextContact has the proper enabled/disabled state when created", () => {
  it("is enabled if the contact is inside texting hours", () => {
    jest.spyOn(timezones, "isBetweenTextingHours").mockReturnValue(true);
    const assignmentTexterContact = new AssignmentTexterContact(
      propsWithEnforcedTextingHoursCampaign
    );
    expect(assignmentTexterContact.state.disabled).toBeFalsy();
    expect(assignmentTexterContact.state.disabledText).toEqual("Sending...");
  });

  it("is disabled if the contact is inside texting hours", () => {
    jest.spyOn(timezones, "isBetweenTextingHours").mockReturnValue(false);
    const assignmentTexterContact = new AssignmentTexterContact(
      propsWithEnforcedTextingHoursCampaign
    );
    expect(assignmentTexterContact.state.disabled).toBeTruthy();
    expect(assignmentTexterContact.state.disabledText).toEqual(
      "Refreshing ..."
    );
  });
});

describe("test isContactBetweenTextingHours", () => {
  let assignmentTexterContact;
  beforeAll(() => {
    assignmentTexterContact = new AssignmentTexterContact(
      propsWithEnforcedTextingHoursCampaign
    );

    jest
      .spyOn(timezones, "isBetweenTextingHours")
      .mockImplementation((o, c) => false);

    MockDate.set("2018-02-01T15:00:00.000Z");

    jest.spyOn(timezones, "getLocalTime").mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("works when the contact has location data with empty timezone", () => {
    const contact = {
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: null,
          hasDST: null
        }
      }
    };

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(contact)
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toEqual({ offset: -5, hasDST: true });
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });

  it("works when the contact has location data", () => {
    const contact = {
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: -5,
          hasDST: true
        }
      }
    };

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(contact)
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toEqual({ hasDST: true, offset: -5 });
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });

  it("works when the contact does not have location data", () => {
    const contact = {};

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(contact)
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toBeNull();
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });
});
