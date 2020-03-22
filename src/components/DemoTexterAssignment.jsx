import PropTypes from "prop-types";
import React from "react";

import AssignmentTexter from "../components/AssignmentTexter";
import AssignmentTexterContactControls from "../components/AssignmentTexterContactControls";
import AssignmentTexterContactNewControls from "../components/AssignmentTexterContactNewControls";
import { applyScript } from "../lib/scripts";

const logFunction = data => {
  console.log("logging data", data);
};

export const tests = {
  a: {
    disabled: false,
    messageStatusFilter: "needsMessage",
    navigationToolbarChildren: {
      onNext: logFunction,
      onPrevious: logFunction,
      title: "21 of 42",
      total: 42,
      currentIndex: 21
    },
    assignment: {
      campaign: {
        id: 10123,
        title: "Event Recruitment for Saving the World",
        useDynamicAssignment: false,
        organization: {
          optOutMessage:
            "Sorry about that, removing you immediately -- have a good day!"
        },
        interactionSteps: [
          {
            id: "13",
            script:
              'Hi, this is {firstName}, a MoveOn volunteer. Can you attend our "Save the world" event Saturday at noon in DC?',
            question: { text: "", answerOptions: [] }
          }
        ]
      },
      campaignCannedResponses: [],
      userCannedResponses: []
    },
    texter: {
      firstName: "Erik",
      lastName: "Tlastname"
    },
    contact: {
      id: "1",
      firstName: "Joe",
      lastName: "Femur",
      messageStatus: "needsMessage",
      questionResponseValues: [],
      messages: [],
      customFields: "{}",
      location: {
        city: "Tucson",
        state: "AZ",
        timezone: {
          offset: -7,
          hasDST: 1
        }
      }
    }
  },
  b: {
    disabled: false,
    messageStatusFilter: "needsResponse",
    navigationToolbarChildren: {
      onNext: logFunction,
      onPrevious: logFunction,
      title: "42 of 88",
      total: 88,
      currentIndex: 42
    },
    assignment: {
      campaign: {
        id: 10123,
        title: "Event Recruitment for Saving the World",
        useDynamicAssignment: false,
        organization: {
          optOutMessage:
            "Sorry about that, removing you immediately -- have a good day!"
        },
        interactionSteps: [
          {
            id: "13",
            script:
              'Hi, this is {firstName}, a MoveOn volunteer. Can you attend our "Save the world" event Saturday at noon in DC?',
            question: {
              text: "Attend Event?",
              answerOptions: [
                {
                  value: "Yes",
                  interactionStepId: "14",
                  nextInteractionStep: {
                    id: "14",
                    script:
                      "That's great, we'll see you there! Will you bring a friend?"
                  }
                },
                {
                  value: "No",
                  interactionStepId: "15",
                  nextInteractionStep: {
                    id: "15",
                    script: "That's too bad, but we love you anyway!"
                  }
                }
              ]
            }
          },
          {
            id: "14",
            script:
              "That's great, we'll see you there! Will you bring a friend?",
            question: {
              text: "Bring friend?",
              answerOptions: [
                {
                  value: "Yes, with friend",
                  interactionStepId: "20",
                  nextInteractionStep: {
                    id: "20",
                    script: "Super, we'll add your +1"
                  }
                },
                {
                  value: "No, no friends",
                  nextInteractionStep: {
                    script:
                      "It's too bad, hopefully you'll meet some cool people there."
                  }
                }
              ]
            }
          }
        ],
        customFields: ["donationLink", "vendor_id"]
      },
      campaignCannedResponses: [
        {
          id: "1",
          title: "Moved",
          text:
            "I'm sorry, we'll update your address -- what is your current zip code?",
          isUserCreated: false
        },
        {
          id: "2",
          title: "Wrong number",
          text: "Ok, we'll remove you from our list.",
          isUserCreated: false
        }
      ],
      userCannedResponses: []
    },
    texter: {
      firstName: "Texterfirst",
      lastName: "Tlastname"
    },
    contact: {
      id: "1",
      firstName: "Joe",
      lastName: "Femur",
      messageStatus: "needsMessage",
      location: {
        city: "Youngstown",
        state: "OH",
        timezone: {
          offset: -5,
          hasDST: 1
        }
      },
      questionResponseValues: [],
      messages: [
        {
          id: "fake1",
          text:
            'Hi, this is Erik, a MoveOn volunteer. Can you attend our "Save the world" event Saturday at noon in DC?',
          isFromContact: false,
          createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
        },
        {
          id: "fake2",
          text: "Yes! I will be there to help save the world.",
          isFromContact: true,
          createdAt: new Date(Number(new Date()) - 142 * 60 * 1000)
        }
      ],
      customFields:
        '{"donationLink": "https://d.example.com/abc123", "vendor_id": "abc123"}'
    }
  },
  c: {
    disabled: false,
    messageStatusFilter: "needsResponse",
    navigationToolbarChildren: {
      onNext: null,
      onPrevious: logFunction,
      title: "88 of 88",
      total: 88,
      currentIndex: 88
    },
    assignment: {
      campaign: {
        id: 10123,
        title: "Event Recruitment for Saving the World",
        useDynamicAssignment: false,
        organization: {
          optOutMessage:
            "Sorry about that, removing you immediately -- have a good day!"
        },
        interactionSteps: [
          {
            id: "13",
            script:
              'Hi, this is {firstName}, a MoveOn volunteer. Can you attend our "Save the world" event Saturday at noon in DC?',
            question: {
              text: "Attend Event?",
              answerOptions: [
                {
                  value: "Yes",
                  interactionStepId: "14",
                  nextInteractionStep: {
                    id: "14",
                    script:
                      "That's great, we'll see you there! Will you bring a friend?"
                  }
                },
                {
                  value: "No",
                  interactionStepId: "15",
                  nextInteractionStep: {
                    id: "15",
                    script: "That's too bad, but we love you anyway!"
                  }
                }
              ]
            }
          },
          {
            id: "14",
            script:
              "That's great, we'll see you there! Will you bring a friend?",
            question: {
              text: "Bring friend?",
              answerOptions: [
                {
                  value: "Yes, with friend",
                  interactionStepId: "20",
                  nextInteractionStep: {
                    id: "20",
                    script: "Super, we'll add your +1"
                  }
                },
                {
                  value: "No, no friends",
                  interactionStepId: "21",
                  nextInteractionStep: {
                    id: "21",
                    script:
                      "It's too bad, hopefully you'll meet some cool people there."
                  }
                }
              ]
            }
          }
        ],
        customFields: ["donationLink", "vendor_id"]
      },
      campaignCannedResponses: [
        {
          id: "1",
          title: "Moved",
          text:
            "I'm sorry, we'll update your address -- what is your current zip code?",
          isUserCreated: false
        },
        {
          id: "2",
          title: "Wrong number",
          text: "Ok, we'll remove you from our list.",
          isUserCreated: false
        }
      ],
      userCannedResponses: []
    },
    texter: {
      firstName: "Texterfirst",
      lastName: "Tlastname"
    },
    contact: {
      id: "1",
      firstName: "Joe",
      lastName: "Femur",
      messageStatus: "needsMessage",
      location: {
        city: "Youngstown",
        state: "OH",
        timezone: {
          offset: -5,
          hasDST: 1
        }
      },
      questionResponseValues: [
        {
          interactionStepId: "13",
          value: "Yes"
        }
      ],
      messages: [
        {
          id: "fake1",
          text:
            'Hi, this is Erik, a MoveOn volunteer. Can you attend our "Save the world" event Saturday at noon in DC?',
          isFromContact: false,
          createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
        },
        {
          id: "fake2",
          text: "Yes! I will be there to help save the world.",
          isFromContact: true,
          createdAt: new Date(Number(new Date()) - 142 * 60 * 1000)
        },
        {
          id: "fake3",
          text:
            "That's great -- can you bring a friend -- the more the merrier!",
          isFromContact: false,
          createdAt: new Date(Number(new Date()) - 140 * 60 * 1000)
        },
        {
          id: "fake4",
          text: "Not sure, I'll see if someone can make it.",
          isFromContact: true,
          createdAt: new Date(Number(new Date()) - 14 * 60 * 1000)
        },
        {
          id: "fake5",
          text: "Ok, let us know what they say.",
          isFromContact: false,
          createdAt: new Date(Number(new Date()) - 10 * 60 * 1000)
        },
        {
          id: "fake6",
          text: "I got their response and they can't make it, so I'll be solo.",
          isFromContact: true,
          createdAt: new Date(Number(new Date()) - 4 * 60 * 1000) // 4 minutes ago
        }
      ],
      customFields:
        '{"donationLink": "https://d.example.com/abc123", "vendor_id": "abc123"}'
    }
  }

  // other tests:
  // c: current question response is deeper in the state
  // d: no questions at all
  // e: opted out
};

export function generateDemoTexterContact(test) {
  const DemoAssignmentTexterContact = function(props) {
    const ControlsComponent = /new=1/.test(document.location.search)
      ? AssignmentTexterContactNewControls
      : AssignmentTexterContactControls;
    console.log("DemoAssignmentTexterContact", props);
    const getMessageTextFromScript = script => {
      return script
        ? applyScript({
            contact: test.contact,
            texter: test.texter,
            customFields: test.assignment.campaign.customFields,
            script
          })
        : null;
    };

    return (
      <ControlsComponent
        contact={test.contact}
        campaign={test.assignment.campaign}
        texter={test.texter}
        assignment={test.assignment}
        navigationToolbarChildren={test.navigationToolbarChildren}
        messageStatusFilter={test.messageStatusFilter}
        disabled={test.disabled}
        onMessageFormSubmit={logFunction}
        onOptOut={logFunction}
        onQuestionResponseChange={logFunction}
        onCreateCannedResponse={logFunction}
        onExitTexter={logFunction}
        onEditStatus={logFunction}
        getMessageTextFromScript={getMessageTextFromScript}
      />
    );
  };

  const DemoTexterTest = function(props) {
    return (
      <AssignmentTexter
        assignment={test.assignment}
        contacts={[{ id: test.contact.id }]}
        allContactsCount={test.navigationToolbarChildren.total}
        assignContactsIfNeeded={test.assignContactsIfNeeded}
        refreshData={logFunction}
        loadContacts={contactIds => {
          console.log("loadContacts", contactIds);
          return { data: { getAssignmentContacts: [test.contact] } };
        }}
        getNewContacts={logFunction}
        onRefreshAssignmentContacts={logFunction}
        organizationId={"1"}
        ChildComponent={DemoAssignmentTexterContact}
      />
    );
  };

  return DemoTexterTest;
}

export const DemoTexterNeedsMessage = generateDemoTexterContact(tests.a);
export const DemoTexterNeedsResponse = generateDemoTexterContact(tests.b);
export const DemoTexterNeedsResponse2ndQuestion = generateDemoTexterContact(
  tests.c
);
