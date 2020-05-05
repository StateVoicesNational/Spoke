import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { genAssignment, contactGenerator } from "../../test_client_helpers";
import { ContactController } from "../../../src/components/AssignmentTexter/ContactController";

/*
    These tests try to ensure the 'texting loop' -- i.e. the loop between
    a texter getting contact data, sending a text, iterating through
    another contact and then texting them, etc.

    Many asynchronous events occur and this component ContactController is
    pretty much the orchestrator of that loop.  Its parent container, TexterTodo,
    is in charge of actually getting the data through GraphQL requests, and
    the child container AssignmentTexterContact is the user interface where the
    messages are sent.

    In summary, the texting loop is:

    * handleFinishContact (triggered from AssignmentTexterContact)
      if hasnext:
        * navigationnext()
          * getcontactdata(newindex)
            if [needs more]:
               props.getnewcontacts()
                [DELAY] componentWillUpdate()
                [OR no new contacts]
            if [getIds]:
               props.loadContacts(getIds)
               [DELAY] return data
        * clearcontactidolddata(contactid)
      else
        * props.assigncontactsifneeded()
          * clearcontactidolddata(contactid)
*/

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function genComponent(assignment, propertyOverrides = {}) {
  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = shallow(
    <ContactController
      assignment={assignment}
      contacts={assignment.contacts}
      allContactsCount={assignment.allContactsCount}
      router={{ push: () => {} }}
      refreshData={() => {}}
      loadContacts={getIds => {}}
      getNewContacts={() => {}}
      assignContactsIfNeeded={(checkServer, currentContactIndex) =>
        Promise.resolve()
      }
      organizationId={"123"}
      {...propertyOverrides}
    />
  );
  return wrapper;
}

describe("ContactController process flows", async () => {
  it("Normal nondynamic assignment queue", async () => {
    const assignment = genAssignment(
      false,
      true,
      /* contacts=*/ 6,
      "needsMessage"
    );
    const createContact = contactGenerator(assignment.id, "needsMessage");
    let calledAssignmentIfNeeded = false;
    let component;
    const wrapper = genComponent(assignment, {
      loadContacts: getIds => {
        return { data: { getAssignmentContacts: getIds.map(createContact) } };
      },
      assignContactsIfNeeded: (checkServer, curContactIndex) => {
        calledAssignmentIfNeeded = true;
        return Promise.resolve();
      }
    });
    component = wrapper.instance();
    let contactsContacted = 0;
    while (component.hasNext()) {
      component.handleFinishContact(wrapper.state("currentContactIndex"));
      contactsContacted += 1;
      await sleep(1); // triggers updates
    }
    // last contact
    component.handleFinishContact(wrapper.state("currentContactIndex"));
    contactsContacted += 1;
    await sleep(1);
    expect(calledAssignmentIfNeeded).toBe(true);
    expect(contactsContacted).toBe(6);
  });
});

/*
TESTS:
* Start with no contacts on mount, and trigger refresh/load

      getNewContacts: () => {
        // add contacts
        // run component.setProps({ contacts: [] })
        // test0: never does: non-dynamic assignment
        // test1: just adding
        // test2: replacing old ones
        // test3: totally new set of ids
        // timing tests:
        // * with delay -- loses to finishing current contacts
      },
      loadContacts: (getIds) => {
        return { data: { getAssignmentContacts: getIds.map(createContact) } }
        // test1: return all
        // test2: return some, but not all (e.g. with permissions missing)
        // test3: return nothing (no permissions) -- should routePush?
      },
      assignContactsIfNeeded: (checkServer, curContactIndex) => {
        // test1: make sure this is called when there are no contacts left
        calledAssignmentIfNeeded = true
        return Promise.resolve()
        // test2: dynamic assignment: triggers getNewContacts
      }
*
*/
