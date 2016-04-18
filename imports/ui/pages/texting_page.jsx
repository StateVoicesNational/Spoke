import React from 'react'
import TexterAssignmentSummary from '../components/texter_assigment_summary'

import AppBar from 'material-ui/lib/app-bar';
import FlatButton from 'material-ui/lib/flat-button';

//First, we pass in any props transferred to this component
export const TextingPage = (props) => {
    const {assignments} = props;
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
        <TexterAssignmentSummary assignments={assignments}/>
    </div>
}