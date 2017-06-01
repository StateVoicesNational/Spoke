import React, { Component } from 'react'
// import { CampaignList } from '../components/campaign_list'
import FloatingActionButton from 'material-ui/FloatingActionButton'
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
    super(props);

    this.state = {
      incomingmessages: []
    };
  }
  componentWillMount() {
    axios.get(`http://localhost:3000/allmessages`)
      .then(res => this.setState({ incomingmessages: res.data }))
  }

  render(){
    return (
      <div>
        <h3> Incoming Messages </h3>
        <ul>
          {this.state.incomingmessages.map( message => {
            if(message.direction == 'inbound' && message.from !=='+19282491850'){
              return <li key={message.id}>Date Sent: {message.date_sent} From: {message.from} To: {message.to} "{message.body}"</li>
            }
          }
          )}
        </ul>
      </div>
    )
  }
}
