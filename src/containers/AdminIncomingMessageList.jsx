import React, { Component } from 'react';
import axios from 'axios';

import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';

export default class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      incomingmessages: []
    }
  }
  componentDidMount() {
    axios.get(`/allmessages/${this.props.params.organizationId}`)
      .then(response => this.setState({ incomingmessages: response.data }))
  }

  render() {
    return (
      <div>
        <h3> All Incoming Messages </h3>
        <div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell> Date Sent: </TableCell>
                <TableCell> From: </TableCell>
                <TableCell> To: </TableCell>
                <TableCell style={{ width: '40%' }}> Message Body </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.incomingmessages.map(message => {
                return (
                  <TableRow key={message.id}>
                    <TableCell> {message.created_at}</TableCell>
                    <TableCell>{message.user_number}</TableCell>
                    <TableCell>{message.contact_number}</TableCell>
                    <TableCell style={{ width: '40%' }}>{message.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
}
