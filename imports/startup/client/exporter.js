export const Exporter = {
  exportAllContacts: function() {
    Meteor.call("campaign.export", (error, data) => {
      if ( error ) {
          alert(error);
          return false;
      }

      var csv = Papa.unparse(data);
      self._downloadCSV(csv);
    });
  },
  _downloadCSV: (csv) => {
    var blob = new Blob([csv]);
    var a = window.document.createElement("a");
    a.href = window.URL.createObjectURL(blob, {type: "text/plain"});a
    a.download = "contacts.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

