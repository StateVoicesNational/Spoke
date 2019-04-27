import React from 'react'
import { shallow } from 'enzyme';
import {StyleSheetTestUtils} from 'aphrodite'

import {genAssignment, contactGenerator} from '../test_client_helpers';
import {AssignmentTexter} from '../../src/components/AssignmentTexter'

describe('AssignmentTexter component', () => {
  const routerPushes = []
  const assignment = genAssignment(false, true, routerPushes, 'needsMessage')
  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = //shallow(
    <AssignmentTexter
       assignment={assignment}
       contacts={assignment.contacts}
       allContactsCount={assignment.allContactsCount}
       router={{push: () => {}}}
       refreshData={() => {}}
       loadContacts={(getIds) => {
         //console.log('LOADCONTACTS', getIds)
       }}
       getNewContacts={() => {
         //console.log('GETNEWCONTACTS')
       }}
       assignContactsIfNeeded={(checkServer, currentContactIndex) => {
         //console.log('ASSIGNCONTACTS', checkServer, currentContactIndex)
       }}
       organizationId={'123'}
    />
  //)
  const component = new wrapper.type(wrapper.props)
  console.log('WRAPPER2', component)
  console.log('WRAPPER3', component.clearContactIdOldData)
  it('does something TKTK', () => {
    expect(true).toBe(true)
  })

})
