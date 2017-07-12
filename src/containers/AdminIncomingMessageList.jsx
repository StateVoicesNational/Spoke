import React, { Component } from 'react'
// import { CampaignList } from '../components/campaign_list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from 'material-ui/Table'

// import SimpleTable from './Table.jsx'
import ContentAdd from 'material-ui/svg-icons/content/add'
import { moment } from 'moment'
import Subheader from 'material-ui/Subheader'
import SpeakerNotesIcon from 'material-ui/svg-icons/action/speaker-notes'
import axios from 'axios'
import Empty from '../components/Empty'

const styles = {
  floatingButton: {
    margin: 0,
    top: 'auto',
    right: 20,
    bottom: 20,
    left: 'auto',
    position: 'fixed'
  }
}

export default class AdminIncomingMessageList extends Component {
  constructor(props) {
    super(props)

    this.state = {
      incomingmessages: [],
      availablephonenumbers: []
    }
  }
  componentDidMount() {
    axios.get('http://localhost:3000/allmessages')
      .then(response => this.setState({ incomingmessages: response.data }))
  }

  getAvailablePhoneNumbers() {
    axios.get('http://localhost:3000/availablephonenumbers')
      .then(response => response.data)
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
            {this.state.incomingmessages.map(message => {
              if (message.direction == 'inbound') {
                return (
                  <TableRow key={message.id}>
                    <TableRowColumn> {message.date_sent}</TableRowColumn>
                    <TableRowColumn>{message.from}</TableRowColumn>
                    <TableRowColumn>{message.to}</TableRowColumn>
                    <TableRowColumn style={{ width: '40%' }}>{message.body}</TableRowColumn>
                  </TableRow>
                  )
              }
            }
            )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }
}
