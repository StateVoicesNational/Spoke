import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import { moment } from 'meteor/momentjs:moment'

export class Export extends React.Component {
  exportAllContacts() {
    const { campaign } = this.props
    const campaignId = campaign._id
    Meteor.call("campaign.export", { campaignId }, (error, data) => {
      if ( error ) {
          alert(error);
          return false;
      }

      console.log("RESULT", data)
      var csv = Papa.unparse(data);
      this._downloadCSV(csv);
    });
  }

  _downloadCSV(csv) {
    const { campaign } = this.props

    var blob = new Blob([csv]);
    var a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(blob, {type: "text/plain"});a
    a.download = `${campaign.title} - ${moment(new Date()).format('YYYY-MM-DD')}.csv`
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  render() {
    return (
      <RaisedButton
        label="Export"
        onTouchTap={this.exportAllContacts.bind(this)}
      />
    )
  }
}

