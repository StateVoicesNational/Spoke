/**
 * @jest-environment jsdom
 */
import React from "react";
import moment from "moment-timezone";
import { mount } from "enzyme";
import Store from "../../src/store";
import { createMemoryHistory } from "react-router";
import { ApolloProvider } from "react-apollo";
import RaisedButton from "material-ui/RaisedButton";
import ReactTestUtils from "react-dom/test-utils";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { StyleSheetTestUtils } from "aphrodite";
import AssignmentTexterContact, {
  InnerAssignmentTexterContact
} from "../../src/containers/AssignmentTexterContact";
import ApolloClientSingleton from "../../src/network/apollo-client-singleton";

import { r } from "../../src/server/models";

import {
  setupTest,
  cleanupTest,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createContacts,
  createTexter,
  assignTexter,
  startCampaign,
  getCampaignContact,
  sendMessage,
  getConversations
} from "../test_helpers";

const MockDate = require("mockdate");

jest.mock("../../src/lib/timezones");
jest.unmock("../../src/lib/tz-helpers");

const timezones = require("../../src/lib/timezones");

const getProps = (messageStatus = "needsMessage") => {
  const campaign = {
    id: 9,
    isArchived: false,
    useDynamicAssignment: null,
    organization: {
      id: 2,
      textingHoursEnforced: true,
      textingHoursStart: 8,
      textingHoursEnd: 21,
      threeClickEnabled: false
    },
    customFields: [],
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

  return {
    ...{
      texter: {
        id: 2,
        firstName: "larry",
        lastName: "person",
        assignedCell: null
      },
      campaign,
      assignment: {
        id: 9,
        userCannedResponses: [],
        campaignCannedResponses: [],
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
        messageStatus,
        messages: []
      }
    }
  };
};

describe("when contact is not within texting hours...", () => {
  let propsWithEnforcedTextingHoursCampaign;
  beforeEach(() => {
    jest.useFakeTimers();
    propsWithEnforcedTextingHoursCampaign = getProps();
  });
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset();
  });

  it("it refreshes data in componentDidMount", () => {
    timezones.isBetweenTextingHours.mockReturnValue(false);
    timezones.getLocalTime.mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
    StyleSheetTestUtils.suppressStyleInjection();
    mount(
      <MuiThemeProvider>
        <InnerAssignmentTexterContact
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={propsWithEnforcedTextingHoursCampaign.campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          contact={propsWithEnforcedTextingHoursCampaign.contact}
        />
      </MuiThemeProvider>
    );
    jest.runOnlyPendingTimers();
    expect(
      propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls
    ).toHaveLength(1);
  });
});

describe("when contact is within texting hours...", () => {
  let propsWithEnforcedTextingHoursCampaign;
  beforeEach(() => {
    jest.useFakeTimers();
    propsWithEnforcedTextingHoursCampaign = getProps();
  });
  beforeEach(() => {
    timezones.isBetweenTextingHours.mockReturnValue(true);
    timezones.getLocalTime.mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
    StyleSheetTestUtils.suppressStyleInjection();
    mount(
      <MuiThemeProvider>
        <InnerAssignmentTexterContact
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={propsWithEnforcedTextingHoursCampaign.campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          contact={propsWithEnforcedTextingHoursCampaign.contact}
        />
      </MuiThemeProvider>
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

describe("when the texter clicks the opt-out button", () => {
  let component;
  let organizationId;
  let optOutContact;
  let assignmentId;
  let root;

  beforeEach(async () => {
    await setupTest();
    const testAdminUser = await createUser();
    const testInvite = await createInvite();
    const testOrganization = await createOrganization(
      testAdminUser,
      testInvite
    );
    const testCampaign = await createCampaign(testAdminUser, testOrganization);
    const testContacts = await createContacts(testCampaign, 1);
    const testTexterUser = await createTexter(testOrganization);
    await startCampaign(testAdminUser, testCampaign);

    const testAssignment = (await assignTexter(
      testAdminUser,
      testTexterUser,
      testCampaign
    )).data.editCampaign;

    const dbCampaignContact = await getCampaignContact(testContacts[0].id);
    assignmentId = dbCampaignContact.assignment_id;
    organizationId = testOrganization.data.createOrganization.id;

    optOutContact = testContacts[0];

    optOutContact.questionResponseValues = [];
    optOutContact.messages = [];
    testAssignment.userCannedResponses = [];
    testAssignment.campaignCannedResponses = [];
    testCampaign.interactionSteps = [
      {
        id: 11,
        question: {
          text: "",
          answerOptions: []
        }
      }
    ];
    testCampaign.organization = {
      optOutMessage: "don't let the door hit you on the way out"
    };

    const message = {
      assignmentId,
      contactNumber: optOutContact.cell,
      text: "hey now"
    };

    await sendMessage(optOutContact.id, testTexterUser, message);

    StyleSheetTestUtils.suppressStyleInjection();
    const store = new Store(createMemoryHistory("/")).data;

    root = document.createElement("div");
    document.body.appendChild(root);

    // the destructuring below is a hack to avoid "hasOwnProperty is not a function" errors
    component = await mount(
      <ApolloProvider store={store} client={ApolloClientSingleton}>
        <MuiThemeProvider>
          <AssignmentTexterContact
            organizationId={organizationId}
            texter={{ ...testTexterUser }}
            campaign={{ ...testCampaign }}
            assignment={{ ...testAssignment }}
            refreshData={() => {}}
            contact={{ ...testContacts[0] }}
            onFinishContact={() => {}}
          />
        </MuiThemeProvider>
      </ApolloProvider>,
      {
        attachTo: root
      }
    );
  });

  afterEach(async () => {
    component.unmount();
    document.body.removeChild(root);
    await cleanupTest();
    if (r.redis) r.redis.flushdb();
  });

  it("calls the createOptOut mutation", async () => {
    const wrappedComponent = component.find(InnerAssignmentTexterContact);
    const wrappedComponentState = wrappedComponent.instance().state;
    const updatedComponent = wrappedComponent.setState({
      ...wrappedComponentState,
      optOutDialogOpen: true,
      disabled: false
    });

    const createOptOutMock = jest.fn((_optOut, _campaignContactId) =>
      Promise.resolve({ campaignContactId: _campaignContactId })
    );

    updatedComponent.instance().props.mutations.createOptOut = createOptOutMock;
    updatedComponent.instance().handleSubmitSurveys = () => {};
    updatedComponent.instance().props.mutations.sendMessage = () => {};

    await updatedComponent.instance().handleOptOut();

    const optOut = {
      cell: optOutContact.cell,
      assignmentId: assignmentId.toString()
    };

    expect(createOptOutMock).toBeCalledTimes(1);
    expect(createOptOutMock).toBeCalledWith(
      organizationId,
      optOut,
      optOutContact.id
    );
  });
});

describe("AssignmentTextContact has the proper enabled/disabled state when created", () => {
  let propsWithEnforcedTextingHoursCampaign;
  beforeEach(() => {
    jest.useFakeTimers();
    propsWithEnforcedTextingHoursCampaign = getProps();
  });

  it("is enabled if the contact is inside texting hours", () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(true);
    const assignmentTexterContact = new InnerAssignmentTexterContact(
      propsWithEnforcedTextingHoursCampaign
    );
    expect(assignmentTexterContact.state.disabled).toBeFalsy();
    expect(assignmentTexterContact.state.disabledText).toEqual("Sending...");
  });

  it("is disabled if the contact is inside texting hours", () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(false);
    const assignmentTexterContact = new InnerAssignmentTexterContact(
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
  let propsWithEnforcedTextingHoursCampaign;

  beforeAll(() => {
    jest.useFakeTimers();
    propsWithEnforcedTextingHoursCampaign = getProps();
    assignmentTexterContact = new InnerAssignmentTexterContact(
      propsWithEnforcedTextingHoursCampaign
    );
    timezones.isBetweenTextingHours.mockImplementation(() => false);
    MockDate.set("2018-02-01T15:00:00.000Z");
    timezones.getLocalTime.mockReturnValue(
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
    expect(theCall[0]).toBeFalsy();
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
