import React, { Component, PropTypes } from 'react';
import Paper from 'material-ui/Paper';
import {AssignmentSummaryListRow} from './assignment_summary_list_row'

export class AssignmentSummaryList extends Component {
  render() {
    const { assignments } = this.props;
    return (
        <Paper>
            {assignments.map(assignment => (
              <AssignmentSummaryListRow assignment={assignment}/>
            ))}
        </Paper>
    );
  }
}