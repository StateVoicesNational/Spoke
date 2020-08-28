import moment from "moment-timezone";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { StyleSheetTestUtils } from "aphrodite";

export function genAssignment(assignmentId, isArchived, hasContacts) {
  const contacts = [];
  if (hasContacts) {
    if (typeof hasContacts !== "number") {
      contacts.push.apply(
        contacts,
        new Array(hasContacts).map((x, i) => ({ id: i }))
      );
    } else {
      contacts.push(
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 }
      );
    }
  }
  const assignmentTest = {
    id: assignmentId,
    userCannedResponses: [
      {
        id: 78,
        title: "user canned response",
        text: "This is a canned response, {firstName}",
        isUserCreated: true
      }
    ],
    campaignCannedResponses: [
      {
        id: 89,
        title: "campaign canned response",
        text: "This is a campaign canned response, {firstName}",
        isUserCreated: true
      }
    ],
    texter: {
      id: 67,
      firstName: "Tixer",
      lastName: "Texterness"
    },
    campaign: {
      id: 56,
      isArchived: isArchived,
      useDynamicAssignment: false,
      organization: {
        id: 123,
        textingHoursEnforced: false,
        textingHoursStart: 9,
        textingHoursEnd: 15,
        optOutMessage: "We will remove you from any further communication."
      },
      customFields: ["customField"],
      interactionSteps: [
        {
          id: 34,
          script:
            "Will you remember to vote today? {firstName} at {customField}"
          /*question: {
              text
              answerOptions: [{
                value
              }]assignmentTest
            }*/
        }
      ]
    },
    contacts: contacts,
    allContactsCount: 5
  };
  return assignmentTest;
}

export function contactGenerator(assignmentId, messageStatus) {
  const messages = [];
  if (messageStatus !== "needsMessage") {
    messages.push(
      {
        id: 90,
        createdAt: "2019-04-27T01:11:07.836Z",
        text: "Will you remember to vote today? Same at fakecustomvalue",
        isFromContact: false
      },
      {
        id: 91,
        createdAt: "2019-04-27T02:22:07.836Z",
        text: "Yes, I will vote for reals",
        isFromContact: true
      }
    );
    //if (messageStatus !== 'convo') {}
  }
  return function createContact(id) {
    return {
      id: id,
      assignmentId: assignmentId,
      firstName: `first${id}Name`,
      lastName: "Lastname",
      cell: "+155555550990",
      zip: `0909${id}`,
      customFields: { customField: "customfieldvalue" },
      optOut: null,
      questionResponseValues: [],
      location: {
        city: "City",
        state: "CA",
        timezone: {
          offset: -9,
          hasDST: 1
        }
      },
      messageStatus: messageStatus,
      messages: messages
    };
  };
}
