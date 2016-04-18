import React, { Component, PropTypes } from 'react';
import Paper from 'material-ui/lib/paper';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import FlatButton from 'material-ui/lib/flat-button';

export default class TexterAssignmentSummary extends Component {
  render() {
    const { assignments } = this.props;
    return (
        <Paper>
            {assignments.map(assignment => (
                <Card key={assignment.id}>
                  <CardHeader
                    title={assignment.name}
                    subtitle={assignment.description}
                    avatar="http://lorempixel.com/100/100/nature/"
                  />
                  <CardActions>
                    <FlatButton label={"Send " + assignment.incompleteMessageCount + " initial messages"} />
                    <FlatButton label={"Send " + assignment.incompleteReplyCount + " replies"} />
                  </CardActions>
                </Card>
            ))}
        </Paper>
    );
  }
}