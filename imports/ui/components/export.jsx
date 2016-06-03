import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import { moment } from 'meteor/momentjs:moment'

export class Export extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      exporting: false
    }
  }
  exportAllContacts() {
    this.setState({exporting: true})
    const { campaign } = this.props
    const campaignId = campaign._id
    Meteor.call("campaign.export", { campaignId }, (error, data) => {
      if ( error ) {
          alert(error);
          return false;
      }
      const csv = Papa.unparse(data);
      this._downloadCSV(csv);
    });
  }

  _downloadCSV(csv) {
    const { campaign } = this.props

    const blob = new Blob([csv]);
    const a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(blob, {type: "text/plain"});a
    a.download = `${campaign.title} - ${moment(new Date()).format('YYYY-MM-DD')}.csv`
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.setState({exporting: false})
  }

  render() {
    const { exporting } = this.state
    return (
      <RaisedButton
        label={exporting ? "Exporting..." : "Export campaign data" }
        disabled={exporting}
        onTouchTap={this.exportAllContacts.bind(this)}
      />
    )
  }
}

