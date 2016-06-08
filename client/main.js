console.log("importing client?")

import '../imports/startup/client'

Meteor.startup(function() {
  console.log("INITIALIZES")
  FlowRouter.initialize();
});


