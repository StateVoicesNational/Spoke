import React, { Component } from 'react'
// import { CampaignList } from '../components/campaign_list'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from 'material-ui/Table'

// import SimpleTable from './Table.jsx'
import axios from 'axios'


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
            <TableHeader>
              <TableRow>
                <TableHeaderColumn> Date Sent: </TableHeaderColumn>
                <TableHeaderColumn> From: </TableHeaderColumn>
                <TableHeaderColumn> To: </TableHeaderColumn>
                <TableHeaderColumn style={{ width: '40%' }}> Message Body </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {this.state.incomingmessages.map(message => (
                <TableRow key={message.id}>
                  <TableRowColumn> {message.created_at}</TableRowColumn>
                  <TableRowColumn>{message.user_number}</TableRowColumn>
                  <TableRowColumn>{message.contact_number}</TableRowColumn>
                  <TableRowColumn style={{ width: '40%' }}>{message.text}</TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
}
