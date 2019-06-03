/**
 * @jest-environment jsdom
 */
import React from 'react'
import {mount} from "enzyme";
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import {StyleSheetTestUtils} from 'aphrodite'

import {genAssignment, contactGenerator} from '../test_client_helpers';
import {TexterTodo} from "../../src/containers/TexterTodo";

function genComponent(isArchived, hasContacts, routerPushes, statusMessage, assignmentNull) {
  const assignmentId = 8
  const contactMapper = contactGenerator(assignmentId, statusMessage)
  let assignment = genAssignment(assignmentId, isArchived, hasContacts)
  if (assignmentNull) {
    assignment = null
  }
  StyleSheetTestUtils.suppressStyleInjection();
  return mount(
      <MuiThemeProvider>
        <TexterTodo
          messageStatus={statusMessage}
          params={{ organizationId: 123, assignmentId: assignmentId }}
          data={{ findNewCampaignContact: { found: false },
                 refetch: function() {
                   // console.log('REFETCHING')
                 },
                 assignment: assignment
               }}
          mutations={{
            getAssignmentContacts: function(contactIds) {
              // console.log('GETASSIGNCONTACTS', contactIds)
              return Promise.resolve(contactIds.map(contactMapper))
            },
            findNewCampaignContact: function(assignmentId) {
              return Promise.resolve({ found: false })
            }
          }}
          router={routerPushes} // used to push redirect
        />
      </MuiThemeProvider>
    )

}

describe('TexterTodo tests...', () => {
  //afterEach(() => {
  //  propsWithEnforcedTextingHoursCampaign.refreshData.mockReset()
  //})

  it('redirect if the assignment is archived', () => {
    const routerPushes = []
    const isArchived = true
    const hasContacts = true
    const component = genComponent(isArchived, hasContacts, routerPushes, 'needsMessage')
    expect(routerPushes[0]).toBe('/app/123/todos')
  })

  it('redirect if the assignment is null', () => {
    const routerPushes = []
    const isArchived = false
    const hasContacts = true
    const assignmentNull = true
    const component = genComponent(isArchived, hasContacts, routerPushes, 'needsMessage', assignmentNull)
    expect(routerPushes[0]).toBe('/app/123/todos')
  })

  it('redirect if the assignment is normal no redirects', () => {
    const routerPushes = []
    const isArchived = false
    const hasContacts = true
    const assignmentNull = true
    const component = genComponent(isArchived, hasContacts, routerPushes, 'needsMessage')
    expect(routerPushes).toEqual([])
  })

  // 1. test assignContactsIfNeeded()
  // 2. test getNewContacts()
  // 3. test loadContacts()
  // 4. component render

})
