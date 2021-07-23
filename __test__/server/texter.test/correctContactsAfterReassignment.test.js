/* eslint-disable no-unused-expressions, consistent-return */
import { runGql } from "../../test_helpers";
import { operations as adminIncomingMessageOps } from "../../../src/containers/AdminIncomingMessageList";
import { operations as texterTodoOps } from "../../../src/containers/TexterTodo";

import {
  testAdminUser,
  testOrganization,
  testCampaign,
  testTexterUser,
  testTexterUser2,
  testContacts,
  assignmentId
} from "./common";

function getAssignmentContactsMutAndVars(props, contactIds, findNew) {
  const { mutation, variables } = texterTodoOps.mutations.getAssignmentContacts(
    props
  )(contactIds, findNew);
  return [mutation, variables];
}

/*
* NOTE:
* beforeEach and afterEach are defined in ./common and are run before the tests in thie
* file because ./common is imported

* We have one test per file to work around limitations with jest's require cache
*/

it("should return contacts after they are reassigned", async () => {
  const {
    mutation: reassignCampaignContacts,
    variables: reassignCampaignContactsVars
  } = adminIncomingMessageOps.mutations.reassignCampaignContacts()(
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

  const [
    getAssignmentContactsBefore,
    assignVarsBefore
  ] = getAssignmentContactsMutAndVars(
    {
      messageStatus: "needsMessage",
      params: {
        assignmentId
      }
    },
    testContacts.map(e => e.id),
    false
  );

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

  const [
    getAssignmentContactsAfter,
    assignVarsAfter
  ] = getAssignmentContactsMutAndVars(
    {
      messageStatus: "needsMessage",
      params: {
        assignmentId: newAssignmentId
      }
    },
    testContacts.map(e => e.id),
    false
  );

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
    getAssignmentContactsResult.data.getAssignmentContacts.map(c => c && c.id)
  ).toEqual(testContacts.map(c => c.id.toString()));
});
