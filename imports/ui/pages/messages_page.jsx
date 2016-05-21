// import React from 'react'
// import Paper from 'material-ui/Paper'
// import { List, ListItem } from 'material-ui/List'
// import { Roles } from 'meteor/alanning:roles'
// import { createContainer } from 'meteor/react-meteor-data'
// import { displayName } from '../../api/users/users'
// import React from 'react'
// import Paper from 'material-ui/Paper'
// import { FlowRouter } from 'meteor/kadira:flow-router'
// import { List, ListItem } from 'material-ui/List'
// import { AppNavigation } from '../../ui/components/navigation'


// const Page = ({ messages, organizationId }) => (
//   <div>
//     <AppNavigation
//       organizationId={organizationId}
//       title="Messages"
//     />
//     <List>
//       {messages.map((message) => (
//         <ListItem
//           key={message._id}
//           primaryText={displayName(message)}
//         />
//       ))}
//     </List>
//   </Paper>
// )

// export const MessagesPage = createContainer(({ organizationId }) => {
//   const handle = Meteor.subscribe('messages')
//   return {
//     organizationId,
//     contacts: CampaignContacts.find({}),
//     loading: !handle.ready()
//   }
// }, Page)