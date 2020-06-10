import PropTypes from "prop-types";
import React from "react";

import ContactController from "./ContactController";
import OldControls from "./OldControls";
import Controls from "./Controls";
import { applyScript } from "../../lib/scripts";

const logFunction = data => {
  console.log("logging data", data);
};

export const tests = testName => {
  const sideboxParam = global.document
    ? String(global.document.location.search).match(/sideboxes=([^&]*)/)
    : null;
  const sideboxes = sideboxParam ? sideboxParam[1] : global.TEXTER_SIDEBOXES;

  const testData = {
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
          title: "GOT Progressive Vote",
          useDynamicAssignment: false,
          organization: {
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!"
          },
          texterUIConfig: {
            options: '{"tag-contact": 1, "contact-reference": 1}',
            sideboxChoices: (sideboxes && sideboxes.split(",")) || []
          },
          interactionSteps: [
            {
              id: "13",
              script:
                "Hi {firstName}, it's {texterAliasOrFirstName} a volunteer with MoveOn. There is an election in Arizona coming Tuesday. Will you vote progressive?",
              question: { text: "", answerOptions: [] }
            }
          ]
        },
        campaignCannedResponses: [],
        userCannedResponses: []
      },
      texter: {
        firstName: "Carlos",
        lastName: "Tlastname"
      },
      contact: {
        id: "1",
        firstName: "Delores",
        lastName: "Huerta (Yeah, she's actually from California)",
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
        title: "12012 of 18000",
        total: 18000,
        currentIndex: 12012
      },
      assignment: {
        campaign: {
          id: 10123,
          title: "GOT Progressive Vote",
          useDynamicAssignment: false,
          organization: {
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!",
            tags: [
              { id: 1, name: "Spanish" },
              { id: 2, name: "911" }
            ]
          },
          texterUIConfig: {
            options: '{"tag-contact": 1, "contact-reference": 1}',
            sideboxChoices: (sideboxes && sideboxes.split(",")) || []
          },
          interactionSteps: [
            {
              id: "13",
              script:
                "Hi {firstName}, it's {texterAliasOrFirstName}, a volunteer with MoveOn. There is an election in Ohio this coming Tuesday. Will you vote progressive?",
              question: {
                text: "Will you vote progressive?",
                answerOptions: [
                  {
                    value: "Yes",
                    interactionStepId: "14",
                    nextInteractionStep: {
                      id: "14",
                      script:
                        "Great! Did you get your ballot in the mail? We suggest getting it ready to turn in early so that it doesn't get lost and it's fun to be done with something important. Let us know if you have any problems or questions. And let us know when you vote!"
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
                "That's great, can you convince three friends to vote as well?",
              question: {
                text: "More friends?",
                answerOptions: [
                  {
                    value: "Yes, friends",
                    interactionStepId: "20",
                    nextInteractionStep: {
                      id: "20",
                      script: "Super, we'll add your +3"
                    }
                  },
                  {
                    value: "No, no friends",
                    nextInteractionStep: {
                      script:
                        "Ok, but we need all the help we can get in getting out the vote!"
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
            text: "Ok, we'll remove you from our list, {firstName}.",
            isUserCreated: false
          }
        ],
        userCannedResponses: []
      },
      texter: {
        firstName: "Christine",
        lastName: "Tlastname"
      },
      contact: {
        id: "1",
        firstName: "Earl",
        lastName: "Femur",
        messageStatus: "needsResponse",
        tags: [],
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
              "Hi Earl, it's Christine, a volunteer with MoveOn. There is an election in Ohio this coming Tuesday. Will you vote progressive?",
            isFromContact: false,
            createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
          },
          {
            id: "fake2",
            text: "Yes! We need to help save the world.",
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
              "Sorry about that, removing you immediately -- have a good day!",
            tags: [
              { id: 1, name: "Spanish" },
              { id: 2, name: "911" }
            ]
          },
          texterUIConfig: {
            options: '{"tag-contact": 1, "contact-reference": 1}',
            sideboxChoices: (sideboxes && sideboxes.split(",")) || []
          },
          interactionSteps: [
            {
              id: "13",
              script:
                "Hi {firstName}, it's {texterAliasOrFirstName}, a volunteer with MoveOn. There is an election in Ohio this coming Tuesday. Will you vote progressive?",
              question: {
                text: "Will you vote progressive?",
                answerOptions: [
                  {
                    value: "Yes",
                    interactionStepId: "14",
                    nextInteractionStep: {
                      id: "14",
                      script:
                        "Great! Did you get your ballot in the mail? We suggest getting it ready to turn in early so that it doesn't get lost and it's fun to be done with something important. Let us know if you have any problems or questions. And let us know when you vote!"
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
                  },
                  {
                    value: "Maybe",
                    interactionStepId: "22",
                    nextInteractionStep: {
                      id: "22",
                      script: "Super, we'll add your +1"
                    }
                  },

                  {
                    value: "Is it ok if my friend is a Republican?",
                    interactionStepId: "23",
                    nextInteractionStep: {
                      id: "23",
                      script: "Yes, let's make sure they hear important facts."
                    }
                  },
                  {
                    value: "More than one friend",
                    interactionStepId: "24",
                    nextInteractionStep: {
                      id: "24",
                      script: "You must be popular, we'll add your +10"
                    }
                  },
                  {
                    value: "Another possible answer",
                    interactionStepId: "25",
                    nextInteractionStep: {
                      id: "25",
                      script: "You must be popular, we'll add your +10"
                    }
                  },
                  {
                    value: "Yet Another possible answer",
                    interactionStepId: "26",
                    nextInteractionStep: {
                      id: "26",
                      script: "You must be popular, we'll add your +10"
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
            text: "Ok, we'll remove you from our list, {firstName}.",
            isUserCreated: false
          },
          {
            id: "3",
            title: "Moved3",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
            isUserCreated: false
          },
          {
            id: "4",
            title: "Moved4",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
            isUserCreated: false
          },
          {
            id: "5",
            title: "Moved5",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
            isUserCreated: false
          },
          {
            id: "6",
            title: "Moved6",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
            isUserCreated: false
          },
          {
            id: "7",
            title: "Moved7",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
            isUserCreated: false
          },
          {
            id: "8",
            title: "Moved8",
            text:
              "I'm sorry, we'll update your address -- what is your current zip code?",
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
        firstName: "Joereallyreallyreallylongname",
        lastName: "Femur",
        messageStatus: "needsResponse",
        location: {
          city: "Youngstown",
          state: "OH",
          timezone: {
            offset: -5,
            hasDST: 1
          }
        },
        tags: [],
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
              "Hi Earl, it's Christine, a volunteer with MoveOn. There is an election in Ohio this coming Tuesday. Will you vote progressive?",
            isFromContact: false,
            createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
          },
          {
            id: "fake2",
            text: "Yes! We need to help save the world.",
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
            text:
              "I got their response and they can't make it, so I'll be solo.",
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
  return testData[testName];
};

export function generateDemoTexterContact(testName) {
  const test = tests(testName);
  const DemoAssignmentTexterContact = function(props) {
    const ControlsComponent = /old=1/.test(document.location.search)
      ? OldControls
      : Controls;
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
      <ContactController
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

export const DemoTexterNeedsMessage = generateDemoTexterContact("a");
export const DemoTexterNeedsResponse = generateDemoTexterContact("b");
export const DemoTexterNeedsResponse2ndQuestion = generateDemoTexterContact(
  "c"
);
