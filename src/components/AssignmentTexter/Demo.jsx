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
  const sideboxChoices = (sideboxes && sideboxes.split(",")) || [];
  const sideboxOptions = {};
  sideboxChoices.forEach(sb => {
    sideboxOptions[sb] = 1;
  });

  const testData = {
    a: {
      // initial message sending
      disabled: false,
      messageStatusFilter: "needsMessage",
      navigationToolbarChildren: {
        onNext: null,
        onPrevious: logFunction,
        title: "42 of 42",
        total: 42,
        currentIndex: 42
      },
      assignment: {
        id: "-1",
        hasUnassignedContactsForTexter: 200,
        allContactsCount: 42,
        unrepliedCount: 12,
        campaign: {
          id: 10123,
          title: "GOT Progressive Vote",
          useDynamicAssignment: true,
          batchSize: 200,
          organization: {
            id: 0,
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!",
            tags: []
          },
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
          },
          interactionSteps: [
            {
              id: "13",
              script:
                "Hi {firstName}, it's {texterAliasOrFirstName} a volunteer with MoveOn. There is an election in Arizona coming Tuesday. Will you vote progressive? STOP2quit",
              question: { text: "", answerOptions: [] }
            }
          ],
          cannedResponses: []
        }
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
      // first reply
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
        id: "-1",
        allContactsCount: 18000,
        campaign: {
          id: 10123,
          title: "GOT Progressive Vote",
          useDynamicAssignment: false,
          organization: {
            id: 0,
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!",
            tags: [
              { id: 1, name: "Spanish" },
              { id: 2, name: "911" }
            ]
          },
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
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
          customFields: ["donationLink", "vendor_id"],
          cannedResponses: [
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
          ]
        }
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
      // second reply
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
        id: "-1",
        allContactsCount: 88,
        hasUnassignedContactsForTexter: 200,
        campaign: {
          id: 10123,
          title: "Event Recruitment for Saving the World",
          useDynamicAssignment: true,
          batchSize: 200,
          organization: {
            id: 0,
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!",
            tags: [
              { id: 1, name: "Spanish" },
              { id: 2, name: "911" }
            ]
          },
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
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
            },
            {
              id: "20",
              script: "Super, we'll add your +1",
              question: {
                text: "Is your friend part of your household?",
                answerOptions: [
                  {
                    value: "Yes, household",
                    interactionStepId: "45",
                    nextInteractionStep: {
                      id: "45",
                      script: "Thanks for telling us"
                    }
                  },
                  {
                    value: "No, not household",
                    interactionStepId: "46",
                    nextInteractionStep: {
                      id: "46",
                      script: "Ok, thanks for telling us"
                    }
                  }
                ]
              }
            }
          ],
          customFields: ["donationLink", "vendor_id"],
          cannedResponses: [
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
          ]
        }
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
            createdAt: new Date(Number(new Date()) - 142 * 60 * 1000),
            media: [
              {
                type: "image/png",
                url:
                  "https://s3-us-west-1.amazonaws.com/spoke-public/spoke_logo.svg?demo"
              }
            ]
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
    },
    d: {
      // empty contact list, dynamic assignment
      disabled: false,
      messageStatusFilter: "needsMessage",
      navigationToolbarChildren: {
        onNext: null,
        onPrevious: null,
        title: "0 of 0",
        total: 0,
        currentIndex: 0
      },
      assignment: {
        id: "-1",
        unrepliedCount: 0,
        allContactsCount: 0,
        campaign: {
          id: 10123,
          title: "GOT Progressive Vote",
          useDynamicAssignment: true,
          batchSize: 200,
          organization: {
            id: 0,
            optOutMessage:
              "Sorry about that, removing you immediately -- have a good day!",
            tags: []
          },
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
          },
          interactionSteps: [
            {
              id: "13",
              script:
                "Hi {firstName}, it's {texterAliasOrFirstName} a volunteer with MoveOn. There is an election in Arizona coming Tuesday. Will you vote progressive?",
              question: { text: "", answerOptions: [] }
            }
          ],
          cannedResponses: []
        },
        hasUnassignedContactsForTexter: 200
      },
      texter: {
        id: 123,
        firstName: "Carlos",
        lastName: "Tlastname"
      },
      currentUser: {
        id: 123,
        roles: ["SUSPENDED", "TEXTER", "VETTED_TEXTER"]
      }
    },

    // other tests:
    // c: current question response is deeper in the state
    // d: no questions at all
    // e: opted out
    todos1: {
      organizationId: "fake",
      texter: {
        id: 123,
        profileComplete: true,
        terms: true,
        roles: ["SUSPENDED", "TEXTER"]
      },
      assignment: {
        id: "fakeassignment",
        hasUnassignedContactsForTexter: true,
        allContactsCount: 100,
        unmessagedCount: 10,
        unrepliedCount: 5,
        badTimezoneCount: 20,
        totalMessagedCount: 5,
        pastMessagesCount: 5,
        skippedMessagesCount: 5,
        campaign: {
          id: "fakecampaign",
          title: "Fake Campaign",
          description: "Will save the world",
          batchSize: 100,
          useDynamicAssignment: true,
          introHtml: null,
          primaryColor: null,
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
          },
          organization: {
            id: "fake"
          }
        }
      },
      refreshData: () => {
        console.log("Summary refresh triggered");
      },
      todoLink: (contactsFilter, aId, router) => {
        console.log("todoLink", contactsFilter, aId);
        if (contactsFilter === "text") {
          router.push("/demo/text");
        } else {
          router.push("/demo/reply");
        }
      }
    },
    todos2: {
      organizationId: "fake",
      texter: {
        id: 123,
        profileComplete: true,
        terms: true,
        roles: ["SUSPENDED", "TEXTER"]
      },
      assignment: {
        id: "fakeassignment",
        hasUnassignedContactsForTexter: false,
        allContactsCount: 100,
        unmessagedCount: 10,
        unrepliedCount: 5,
        badTimezoneCount: 20,
        totalMessagedCount: 5,
        pastMessagesCount: 5,
        skippedMessagesCount: 5,
        campaign: {
          id: "fakecampaign",
          title: "Fake Campaign",
          description: "Will save the world",
          batchSize: 100,
          useDynamicAssignment: true,
          introHtml: null,
          primaryColor: null,
          texterUIConfig: {
            options: JSON.stringify(sideboxOptions),
            sideboxChoices
          },
          organization: {
            id: "fake"
          }
        },
        feedback: {
          isAcknowledged: false,
          createdBy: {
            name: "Mx Reviewer"
          },
          message:
            "You did so well! Note this is a demo and issues, skills and messaging are customizable, and this would be a final message written by the reviewer.",
          issueCounts: {
            optOut: 1,
            tagging: 1,
            response: 1,
            scriptEdit: 1,
            engagement: 1
          },
          skillCounts: {
            extraOptOut: 1,
            jumpAhead: 1,
            multiMessage: 1,
            composing: 1
          },
          sweepComplete: true
        }
      },
      refreshData: () => {
        console.log("Summary refresh triggered");
      },
      todoLink: (contactsFilter, aId, router) => {
        console.log("todoLink", contactsFilter, aId);
        if (contactsFilter === "text") {
          router.push("/demo/text");
        } else {
          router.push("/demo/reply");
        }
      }
    }
  };
  return testData[testName];
};

export const assignmentSummaryTestProps = {
  summaryA: {}
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
        currentUser={test.currentUser}
        navigationToolbarChildren={test.navigationToolbarChildren}
        enabledSideboxes={props.enabledSideboxes}
        messageStatusFilter={test.messageStatusFilter}
        disabled={test.disabled}
        onMessageFormSubmit={() => async data => {
          console.log("logging data onMessageFormSubmit", data);

          props.onFinishContact(1);
        }}
        onOptOut={logFunction}
        onQuestionResponseChange={logFunction}
        onCreateCannedResponse={logFunction}
        onExitTexter={logFunction}
        onEditStatus={logFunction}
        onUpdateTags={async data => logFunction(data)}
        refreshData={logFunction}
        getMessageTextFromScript={getMessageTextFromScript}
      />
    );
  };

  const DemoTexterTest = function(props) {
    console.log("DemoTexterTest", test);
    return (
      <ContactController
        assignment={test.assignment}
        campaign={test.assignment.campaign}
        contacts={test.contact ? [{ id: test.contact.id }] : []}
        allContactsCount={test.navigationToolbarChildren.total}
        refreshData={logFunction}
        loadContacts={contactIds => {
          console.log("loadContacts", contactIds);
          return { data: { getAssignmentContacts: [test.contact] } };
        }}
        onRefreshAssignmentContacts={logFunction}
        organizationId={"1"}
        ChildComponent={DemoAssignmentTexterContact}
        messageStatusFilter={test.messageStatusFilter}
        currentUser={test.currentUser}
      />
    );
  };

  return DemoTexterTest;
}

export const DemoTexterNeedsMessage = generateDemoTexterContact("a");
export const DemoTexterNeedsResponse = generateDemoTexterContact("b");
export const DemoTexter2ndQuestion = generateDemoTexterContact("c");
export const DemoTexterDynAssign = generateDemoTexterContact("d");
