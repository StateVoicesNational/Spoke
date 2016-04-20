import React from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
//First, we pass in any props transferred to this component
import {AssignmentSummaryList} from '../components/assignment_summary_list'

export class AssignmentListPage extends React.Component {
    render () {
      const {assignments} = this.props;
      return <div>
          <AppBar title="Texting"
                  iconElementLeft={<div/>}
                  iconElementRight={
                      <FlatButton
                        label="Go to Setup"
                        linkButton={true}
                        href="/setup"
                        secondary={true} />}
                      />
          <AssignmentSummaryList assignments={assignments}/>
      </div>
    }
}