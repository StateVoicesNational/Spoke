import React from 'react'
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
//First, we pass in any props transferred to this component
import {AssignmentSummaryList} from '../components/assignment_summary_list'
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import {List, ListItem} from 'material-ui/List';

export class AssignmentListPage extends React.Component {
    render () {
      const {assignments} = this.props;
      return <div>
      <Drawer open={true}>
        <AssignmentSummaryList assignments={assignments}/>
      </Drawer>

          <AppBar title="Texting"
                  iconElementLeft={<div/>}
                  iconElementRight={
                      <FlatButton
                        label="Go to Setup"
                        linkButton={true}
                        href="/setup"
                        secondary={true} />}
                      />
      </div>
    }
}