import React from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
//First, we pass in any props transferred to this component
import {AssignmentSummaryList} from '../components/assignment_summary_list'
import {Texter} from '../components/texter'

export class AssignmentPage extends React.Component {
    render () {
      const {assignment, contacts, loading} = this.props;
      if (!assignment)
        return <div>Loading!</div>
      else
        return <div>
                  <AppBar title={assignment.campaign.title}
                    iconElementLeft={<div/>}
                        />
                    {contacts.length > 0 ? <Texter assignment={assignment} contacts={contacts} /> : 'No contacts!'}
                </div>
    }
}