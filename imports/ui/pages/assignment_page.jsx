import React from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
//First, we pass in any props transferred to this component
import {AssignmentSummaryList} from '../components/assignment_summary_list'
import {Texter} from '../components/texter'

export class AssignmentPage extends React.Component {
    render () {
      const {assignment, contacts} = this.props;
      console.log("contacts", contacts);
      return <div>
                <AppBar title={"Assignment"}
                  iconElementLeft={<div/>}
                      />
                  {contacts.length > 0 ? <Texter contacts={contacts} /> : 'No contacts!'}
              </div>
    }
}