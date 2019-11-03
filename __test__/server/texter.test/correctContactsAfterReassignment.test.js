/* eslint-disable no-unused-expressions, consistent-return */
import { runGql, getGql } from "../../test_helpers";

import {
  testAdminUser,
  testOrganization,
  testCampaign,
  testTexterUser,
  testTexterUser2,
  testContacts,
  assignmentId
} from "./common";

/*
* NOTE:
* beforeEach and afterEach are defined in ./common and are run before the tests in thie
* file because ./common is imported

* We have one test per file to work around limitations with jest's require cache
*/

it("should return contacts after they are reassigned", async () => {
  // set up graphQL call for reassignCampaignContacts
  const { mutations: adminIncomingMessageListMutations } = getGql(
    "../src/containers/AdminIncomingMessageList",
    {
      params: {
        organizationId: testOrganization.id
      }
    },
    "organization"
  );

  const [
    reassignCampaignContacts,
    reassignCampaignContactsVars
  ] = adminIncomingMessageListMutations.reassignCampaignContacts(
    testOrganization.data.createOrganization.id,
    testContacts.map(c => {
      return {
        campaignId: testCampaign.id,
        campaignContactId: c.id,
        messageIds: []
      };
    }),
    testTexterUser2.id
  );

  // set up graphQL call for getAssignmentContacts
  const { mutations: mutationsBefore } = getGql(
    "../src/containers/TexterTodo",
    {
      messageStatus: "needsMessage",
      params: {
        assignmentId
      }
    }
  );

  const [
    getAssignmentContactsBefore,
    assignVarsBefore
  ] = mutationsBefore.getAssignmentContacts(testContacts.map(e => e.id), false);

  // call getAssignmentContacts to get CampaignContacts into the DataLoader cache.
  await runGql(getAssignmentContactsBefore, assignVarsBefore, testTexterUser);

  // make the reassign call
  const reassignReturn = await runGql(
    reassignCampaignContacts,
    reassignCampaignContactsVars,
    testAdminUser
  );

  const newAssignmentId =
    reassignReturn.data.reassignCampaignContacts[0].assignmentId;

  // set up getAssignmentContacts to get the contacts so we can examine them
  const { mutations: mutationsAfter } = getGql("../src/containers/TexterTodo", {
    messageStatus: "needsMessage",
    params: {
      assignmentId: newAssignmentId
    }
  });

  const [
    getAssignmentContactsAfter,
    assignVarsAfter
  ] = mutationsAfter.getAssignmentContacts(testContacts.map(e => e.id), false);

  // make getAssignmentContacts call
  const getAssignmentContactsResult = await runGql(
    getAssignmentContactsAfter,
    assignVarsAfter,
    testTexterUser2
  );

  // test our expectations
  expect(getAssignmentContactsResult.data.getAssignmentContacts.length).toBe(
    100
  );
  expect(
    getAssignmentContactsResult.data.getAssignmentContacts.map(c => c.id)
  ).toEqual(testContacts.map(c => c.id.toString()));
});
