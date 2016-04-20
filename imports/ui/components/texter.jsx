import React, { Component } from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper'
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField'

import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton/IconButton';
import DescriptionIcon from 'material-ui/svg-icons/action/description';
import MenuItem from 'material-ui/MenuItem';

import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';

export class Texter extends Component {
  render() {
    const { contact } = this.props;
    return (
        <Paper>
          <Card key={contact.contactId}>
            <CardHeader
              title={contact.name}
              subtitle={contact.number} />
              <CardText>
            <TextField
               hintText="Message Field"
               defaultValue={"Hey there, " + contact.name + "! This is Smee from the Batman 2016 campaign. Thanks for helping us out. The next few states are really important for us to win! Can you join us for a phonebanking event near you next Thursday at 5pm?"}
               multiLine={true}
               fullWidth={true}/>
              </CardText>
          </Card>
          <Toolbar>
                 <ToolbarGroup firstChild={true}>
                 <IconMenu
                   iconButtonElement={<IconButton><DescriptionIcon /></IconButton>}>
                   <MenuItem primaryText="Refresh" />
                   <MenuItem primaryText="Send feedback" />
                   <MenuItem primaryText="Settings" />
                   <MenuItem primaryText="Help" />
                   <MenuItem primaryText="Sign out" />
                 </IconMenu>
                 </ToolbarGroup>
                 <ToolbarGroup>
                   <RaisedButton label="Send" primary={true} />
                 </ToolbarGroup>
               </Toolbar>
      </Paper>
    );
  }
}

