import { runGql, getGql } from "../../test_helpers";

import { testTexterUser, testContacts, assignmentId } from "./common";

/*
* NOTE:
* beforeEach and afterEach are defined in ./common and are run before the tests in thie
* file because ./common is imported

* We have one test per file to work around limitations with jest's require cache
*/

it("should return contacts with correct opt_out after they are opted out", async () => {
  // set up graphQL call for createOptOut
  const { mutations: assignmentTexterContactMutations } = getGql(
    "../src/containers/AssignmentTexterContact"
  );

  const [
    createOptOut,
    createOptOutVars
  ] = assignmentTexterContactMutations.createOptOut(
    {
      cell: testContacts[0].cell,
      assignmentId
    },
    testContacts[0].id
  );

  // set up graphQL call for getAssignmentContacts
  const { mutations } = getGql("../src/containers/TexterTodo", {
    messageStatus: "needsMessage",
    params: {
      assignmentId
    }
  });

  const [getAssignmentContacts, assignVars] = mutations.getAssignmentContacts(
    testContacts.map(e => e.id),
    false
  );

  // getAssignmentContacts before creating the opt out
  const getAssignmentContactsBeforeResult = await runGql(
    getAssignmentContacts,
    assignVars,
    testTexterUser
  );
  expect(
    getAssignmentContactsBeforeResult.data.getAssignmentContacts[0].optOut
  ).toBeFalsy();

  // create the optOut
  await runGql(createOptOut, createOptOutVars, testTexterUser);

  // getAssignmentContacts after creating the opt out
  const getAssignmentContactsAfterResult = await runGql(
    getAssignmentContacts,
    assignVars,
    testTexterUser
  );

  expect(
    getAssignmentContactsAfterResult.data.getAssignmentContacts[0].optOut
  ).toEqual({
    id: "optout"
  });
});
