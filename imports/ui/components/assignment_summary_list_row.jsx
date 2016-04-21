import React, { Component } from 'react';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

export class AssignmentSummaryListRow extends Component {
  render() {
    const { assignment } = this.props;
    console.log(assignment._id)
    return (
      <Card key={assignment._id}>
        <CardHeader
          title={assignment.campaign.title}
          subtitle={assignment.campaign.description}
          avatar="http://lorempixel.com/100/100/nature/"
        />
        <CardActions>
          <FlatButton
            label={"Go"}
            linkButton={true}
            href={"/assignments/" + assignment._id}/>
        </CardActions>
      </Card>
    );
  }
}

