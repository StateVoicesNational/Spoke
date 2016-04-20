import React, { Component } from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Paper} from 'material-ui/Paper'
import {FlatButton} from 'material-ui/FlatButton';
import {TextField} from 'material-ui/TextField'

export class Texter extends Component {
  render() {
    const { contact } = this.props;
    return (
        <Paper>
        <Card key={contact.contactId}>
          <CardHeader
            title={contact.name}
            subtitle={contact.number} />
          <CardActions>
            <FlatButton label={"Send"} />
          </CardActions>
        </Card>
        <TextField
           hintText="Message Field"
           defaultValue="Here's a bunch of tropery! Tell me more about this item"
           multiLine={true}/>

      </Paper>
    );
  }
}

