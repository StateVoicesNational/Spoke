import React from 'react'
import {Card, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton'
export const Dashboard = ({ stats }) => (
    <div>
      <div className="row">
        { stats.map(([title, stat]) => (
            <div className="col-xs">
                <Card key={title}>
                  <CardTitle title={title} />
                  <CardText>{stat}</CardText>
                </Card>
            </div>
        )) }
      </div>
    </div>
)