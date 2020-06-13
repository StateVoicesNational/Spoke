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
          title: "Event Recruitment",
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
                "Hey {firstName}, it's {texterAliasOrFirstName} with the Movement for Black Lives! We're coming together on Friday, June 19th at 4:00 PM to commemorate Juneteenth and make demands for Black lives in Philadelphia. Are you able to make it?",
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
          title: "Event Recruitment",
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
                "Hey {firstName}, it's {texterAliasOrFirstName} with the Movement for Black Lives! We're coming together on Friday, June 19th at 4:00 PM to commemorate Juneteenth and make demands for Black lives in Philadelphia. Are you able to make it?",
              question: {
                text: "Will they will go to the event?",
                answerOptions: [
                  {
                    value: "Yes",
                    interactionStepId: "14",
                    nextInteractionStep: {
                      id: "14",
                      script:
                        "Amazing! You can RSVP right here: m4bl.org Thank you for being a part of the movement! Would you be able to bring 3 friends to make sure this event has the most impact?"
                    }
                  },
                  {
                    value: "No",
                    interactionStepId: "15",
                    nextInteractionStep: {
                      id: "15",
                      script:
                        "Got it, thanks for letting me know. Hope you have a great day!"
                    }
                  },
                  {
                    value: "Maybe",
                    interactionStepId: "16",
                    nextInteractionStep: {
                      id: "16",
                      script:
                        "Ok, if you can make it you can RSVP right here: m4bl.org Thank you for being a part of the movement!"
                    }
                  }
                ]
              }
            },
            {
              id: "14",
              script: "Will they bring 3 friends?",
              question: {
                text: "Will they bring 3 friends?",
                answerOptions: [
                  {
                    value: "Yes, friends",
                    interactionStepId: "20",
                    nextInteractionStep: {
                      id: "20",
                      script:
                        "Great! Please make sure to send them the RSVP link! Have a great day."
                    }
                  },
                  {
                    value: "Maybe, friends",
                    nextInteractionStep: {
                      id: "21",
                      script:
                        "Ok, if you can make it you can make sure to send them the RSVP link. Have a great day!"
                    }
                  },
                  {
                    value: "No, no friends",
                    nextInteractionStep: {
                      id: "22",
                      script: "Ok, I understand! Have a great day."
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
            title: "How did you get my information?",
            text:
              "We received our information from the publicly available voter file and the Democratic Party.",
            isUserCreated: false
          },
          {
            id: "2",
            title: "Multimedia Message",
            text:
              "I’m sorry, I’m unfortunately not able to receive images or videos. Would you mind explaining via text?",
            isUserCreated: false
          },
          {
            id: "3",
            title: "Sensitive Question",
            text:
              "I’m sorry, as a volunteer I'm unable to answer that for you right now. Please contact info@m4bl.org to have your concerns addressed. Thank you.",
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
              "Hey Earl, it's Christine with the Movement for Black Lives! We're coming together on Friday, June 19th at 4:00 PM to commemorate Juneteenth and make demands for Black lives in Philadelphia. Are you able to make it?",
            isFromContact: false,
            createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
          },
          {
            id: "fake2",
            text: "Yes!",
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
          title: "Event Recruitment",
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
                "Hey {firstName}, it's {texterAliasOrFirstName} with the Movement for Black Lives! We're coming together on Friday, June 19th at 4:00 PM to commemorate Juneteenth and make demands for Black lives in Philadelphia. Are you able to make it?",
              question: {
                text: "Will they will go to the event?",
                answerOptions: [
                  {
                    value: "Yes",
                    interactionStepId: "14",
                    nextInteractionStep: {
                      id: "14",
                      script:
                        "Amazing! You can RSVP right here: m4bl.org Thank you for being a part of the movement! Would you be able to bring 3 friends to make sure this event has the most impact?"
                    }
                  },
                  {
                    value: "No",
                    interactionStepId: "15",
                    nextInteractionStep: {
                      id: "15",
                      script:
                        "Got it, thanks for letting me know. Hope you have a great day!"
                    }
                  },
                  {
                    value: "Maybe",
                    interactionStepId: "16",
                    nextInteractionStep: {
                      id: "16",
                      script:
                        "Ok, if you can make it you can RSVP right here: m4bl.org Thank you for being a part of the movement!"
                    }
                  }
                ]
              }
            },
            {
              id: "14",
              script:
                "Amazing! You can RSVP right here: m4bl.org Thank you for being a part of the movement! Would you be able to bring 3 friends to make sure this event has the most impact?",
              question: {
                text: "Bring friend?",
                answerOptions: [
                  {
                    value: "Yes, with friend",
                    interactionStepId: "20",
                    nextInteractionStep: {
                      id: "20",
                      script:
                        "Great! Please make sure to send them the RSVP link! Have a great day."
                    }
                  },
                  {
                    value: "No, no friends",
                    interactionStepId: "21",
                    nextInteractionStep: {
                      id: "21",
                      script: "Ok, I understand! Have a great day."
                    }
                  },
                  {
                    value: "Maybe, with friends",
                    interactionStepId: "22",
                    nextInteractionStep: {
                      id: "22",
                      script:
                        "Ok, if you can make it you can make sure to send them the RSVP link. Have a great day!"
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
            title: "How did you get my information?",
            text:
              "We received our information from the publicly available voter file and the Democratic Party.",
            isUserCreated: false
          },
          {
            id: "2",
            title: "Multimedia Message",
            text:
              "I’m sorry, I’m unfortunately not able to receive images or videos. Would you mind explaining via text?",
            isUserCreated: false
          },
          {
            id: "3",
            title: "Sensitive Question",
            text:
              "I’m sorry, as a volunteer I'm unable to answer that for you right now. Please contact info@m4bl.org to have your concerns addressed. Thank you.",
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
              "Hey Earl, it's Christine with the Movement for Black Lives! We're coming together on Friday, June 19th at 4:00 PM to commemorate Juneteenth and make demands for Black lives in Philadelphia. Are you able to make it?",
            isFromContact: false,
            createdAt: new Date(Number(new Date()) - 314 * 60 * 1000)
          },
          {
            id: "fake2",
            text: "Yes!",
            isFromContact: true,
            createdAt: new Date(Number(new Date()) - 142 * 60 * 1000)
          },
          {
            id: "fake3",
            text:
              "Amazing! You can RSVP right here: m4bl.org Thank you for being a part of the movement! Would you be able to bring 3 friends to make sure this event has the most impact?",
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
            text:
              "Ok, if you can make it you can make sure to send them the RSVP link. Have a great day!",
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
