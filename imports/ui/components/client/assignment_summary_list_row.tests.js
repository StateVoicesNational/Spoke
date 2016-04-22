/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Factory } from 'meteor/dburles:factory'
import { expect } from 'meteor/practicalmeteor:chai'
import React from 'react'
import { shallow } from 'enzyme'

import { AssignmentSummaryListRow } from '../assignment_summary_list_row'

describe('AssignmentSummaryListRow', function () {
  it('shows the Send button', function () {
    const assignment = Factory.build('assignment')
    const el = shallow(<AssignmentSummaryListRow assignment={assignment} />)
    expect(el.text()).to.contain('Send replies')
  })
})
