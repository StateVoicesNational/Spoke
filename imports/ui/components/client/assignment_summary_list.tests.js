/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Factory } from 'meteor/dburles:factory';
import { expect, assert } from 'meteor/practicalmeteor:chai';
import React from 'react';
import { shallow } from 'enzyme';

import {AssignmentSummaryList} from '../assignment_summary_list'
import {AssignmentSummaryListRow} from '../assignment_summary_list_row'

// ?TODO does it need to be in client/ folder?

// import { withRenderedTemplate } from '../../test-helpers.js';
// import './texter_assignment_summary.jsx';

describe('AssignmentSummaryList', function () {
  it('shows the right number of assignment rows', function () {
    const assignment = Factory.build('assignment');
    const assignments = [assignment, assignment, assignment];

    const el = shallow(<AssignmentSummaryList assignments={assignments}></AssignmentSummaryList>);
    const rows = el.find(AssignmentSummaryListRow);
    expect(rows).to.have.length.of(3);

  });
});