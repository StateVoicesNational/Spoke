import {
  testOrganization,
  testTexterUser,
  testContact,
  assignmentId
} from "./common";
/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../../src/server/models";

import { runGql, getCampaignContact } from "../../test_helpers";
import waitForExpect from "wait-for-expect";
import { operations as texterTodoOps } from "../../../src/containers/TexterTodo";
import { operations as assignmentTexterOps } from "../../../src/containers/AssignmentTexterContact";

function sendMessageMutAndVars(message, contactId) {
  const { mutation, variables } = assignmentTexterOps.mutations.sendMessage({})(
    message,
    contactId
  );
  return [mutation, variables];
}

function getAssignmentContactsMutAndVars(props, contactIds, findNew) {
  const { mutation, variables } = texterTodoOps.mutations.getAssignmentContacts(
    props
  )(contactIds, findNew);
  return [mutation, variables];
}

const getContactsQuery = texterTodoOps.queries.contactData.query;
const getContactsVars = props =>
  texterTodoOps.queries.contactData.options(props).variables;

function getIndexOfMinId(returnValue) {
  const { index: indexOfMinId } = returnValue.data.getAssignmentContacts.reduce(
    ({ index, id }, currentValue, currentIndex) => {
      if (parseInt(id, 10) > parseInt(currentValue.id, 10)) {
        return { index: currentIndex, id: currentValue.id };
      }
      return { index, id };
    },
    { index: Number.MAX_SAFE_INTEGER, id: Number.MAX_SAFE_INTEGER }
  );
  return indexOfMinId;
}

/*
* NOTE:
* beforeEach and afterEach are defined in ./common and are run before the tests in the
* file because ./common is imported

* We have one test per file to work around limitations with jest's require cache
*/
it("should send an initial message to test contacts", async () => {
  const organizationId = testOrganization.data.createOrganization.id;
  const texterTodoProps = {
    messageStatus: "needsMessage",
    params: { assignmentId: assignmentId.toString(), organizationId },
    location: { query: {} }
  };

  const contactsResult = await runGql(
    getContactsQuery,
    getContactsVars(texterTodoProps),
    testTexterUser
  );

  const [getAssignmentContacts, assignVars] = getAssignmentContactsMutAndVars(
    texterTodoProps,
    contactsResult.data.assignment.contacts.map(e => e.id),
    false
  );

  const ret2 = await runGql(getAssignmentContacts, assignVars, testTexterUser);
  const contact = ret2.data.getAssignmentContacts[getIndexOfMinId(ret2)];

  const message = {
    contactNumber: contact.cell,
    userId: testTexterUser.id.toString(),
    text: "test text",
    assignmentId: assignmentId.toString()
  };

  const [messageMutation, messageVars] = sendMessageMutAndVars(
    message,
    contact.id
  );

  const messageResult = await runGql(
    messageMutation,
    messageVars,
    testTexterUser
  );
  const campaignContact = messageResult.data.sendMessage;

  // These things are expected to be returned from the sendMessage mutation
  expect(campaignContact.messageStatus).toBe("messaged");
  expect(campaignContact.messages.length).toBe(1);
  expect(campaignContact.messages[0].text).toBe(message.text);

  const expectedDbMessage = {
    user_id: testTexterUser.id,
    contact_number: testContact.cell,
    text: message.text,
    campaign_contact_id: testContact.id
  };

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message");
    expect(dbMessage.length).toEqual(1);
    expect(dbMessage[0]).toEqual(
      expect.objectContaining({
        send_status: "SENT",
        ...expectedDbMessage
      })
    );
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("messaged");
  });

  // Refetch the contacts via gql to check the caching
  const ret3 = await runGql(getAssignmentContacts, assignVars, testTexterUser);
  expect(
    ret3.data.getAssignmentContacts[getIndexOfMinId(ret3)].messageStatus
  ).toEqual("messaged");
});

it("should be able to receive a response and reply (using fakeService)", async () => {
  const organizationId = testOrganization.data.createOrganization.id;
  const texterTodoProps = {
    messageStatus: "needsMessage",
    params: { assignmentId: assignmentId.toString(), organizationId },
    location: { query: {} }
  };

  const contactsResult = await runGql(
    getContactsQuery,
    getContactsVars(texterTodoProps),
    testTexterUser
  );

  const [getAssignmentContacts, assignVars] = getAssignmentContactsMutAndVars(
    texterTodoProps,
    contactsResult.data.assignment.contacts.map(e => e.id),
    false
  );

  const ret2 = await runGql(getAssignmentContacts, assignVars, testTexterUser);
  const contact = ret2.data.getAssignmentContacts[getIndexOfMinId(ret2)];

  const message = {
    contactNumber: contact.cell,
    userId: testTexterUser.id.toString(),
    text: "test text autorespond",
    assignmentId: assignmentId.toString()
  };

  const [messageMutation, messageVars] = sendMessageMutAndVars(
    message,
    contact.id
  );

  await runGql(messageMutation, messageVars, testTexterUser);

  // wait for fakeservice to autorespond
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message").orderBy("created_at");
    expect(dbMessage.length).toEqual(2);
    expect(dbMessage[1]).toEqual(
      expect.objectContaining({
        send_status: "DELIVERED",
        text: `responding to ${message.text}`,
        user_id: null,
        contact_number: testContact.cell,
        campaign_contact_id: testContact.id
      })
    );
    expect(dbMessage[1].is_from_contact).toBeTruthy();
  });

  await waitForExpect(async () => {
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("needsResponse");
  });

  // Refetch the contacts via gql to check the caching
  const ret3 = await runGql(getAssignmentContacts, assignVars, testTexterUser);
  expect(
    ret3.data.getAssignmentContacts[getIndexOfMinId(ret3)].messageStatus
  ).toEqual("needsResponse");

  // Then we reply
  const message2 = {
    contactNumber: contact.cell,
    userId: testTexterUser.id.toString(),
    text: "reply",
    assignmentId: assignmentId.toString()
  };

  const [replyMutation, replyVars] = sendMessageMutAndVars(
    message2,
    contact.id
  );

  await runGql(replyMutation, replyVars, testTexterUser);

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message").orderBy("created_at");
    expect(dbMessage.length).toEqual(3);
    expect(dbMessage[2]).toEqual(
      expect.objectContaining({
        send_status: "SENT"
      })
    );
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("convo");
  });

  // Refetch the contacts via gql to check the caching
  const ret4 = await runGql(getAssignmentContacts, assignVars, testTexterUser);
  expect(
    ret4.data.getAssignmentContacts[getIndexOfMinId(ret4)].messageStatus
  ).toEqual("convo");
});
