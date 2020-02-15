import PropTypes from "prop-types";
import React from "react";

import AssignmentTexter from "../components/AssignmentTexter";
import AssignmentTexterContactControls from "../components/AssignmentTexterContactControls";
import { applyScript } from "../lib/scripts";

const logFunction = data => {
  console.log("logging data", data);
};

const tests = {
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
        id: 0,
        useDynamicAssignment: false,
        organization: {
          optOutMessage:
            "Sorry about that, removing you immediately -- have a good day!"
        },
        interactionSteps: [
          {
            id: "13",
            script: "Hi {firstName}, have you voted today, yet?",
            question: { text: "", answerOptions: [] }
          }
        ]
      },
      campaignCannedResponses: [],
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
      questionResponseValues: [],
      messages: [],
      customFields: "{}"
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
        id: 0,
        useDynamicAssignment: false,
        organization: {
          optOutMessage:
            "Sorry about that, removing you immediately -- have a good day!"
        },
        interactionSteps: [
          {
            id: "13",
            script: "Hi {firstName}, have you voted today, yet?",
            question: { text: "", answerOptions: [] }
          }
        ],
        customFields: ["donationLink", "vendor_id"]
      },
      campaignCannedResponses: [],
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
      questionResponseValues: [],
      messages: [
        {
          text: "Will you come to the event?",
          isFromContact: false,
          createdAt: new Date(Number(new Date()) - 14 * 60 * 1000) // 14 minutes ago
        },
        {
          text: "Yes, that would be lovely!",
          isFromContact: true,
          createdAt: new Date()
        }
      ],
      customFields:
        '{"donationLink": "https://d.example.com/abc123", "vendor_id": "abc123"}'
    }
  }
};

export function generateDemoTexterContact(test) {
  const DemoAssignmentTexterContact = function(props) {
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
      <AssignmentTexterContactControls
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
