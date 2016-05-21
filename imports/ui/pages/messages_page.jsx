import React from 'react'
import { List, ListItem } from 'material-ui/List'
import { createContainer } from 'meteor/react-meteor-data'
import { AppNavigation } from '../../ui/components/navigation'
import { Messages } from '../../api/messages/messages'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { moment } from 'meteor/momentjs:moment'
import { groupBy, toPairs, last } from 'lodash'
import { displayName } from '../../api/users/users'

const Page = ({ threads, organizationId }) => (
  //  ${moment(message.createdAt).fromNow()}
  <div>
    <AppNavigation
      organizationId={organizationId}
      title="Messages"
    />
    <List>
      {threads.map((message) => (
            <ListItem
          key={message._id}
          primaryText={displayName(message.campaignContact())}
          secondaryText={`${message.text}`}
          secondaryTextLines={2}
        />
      ))}
    </List>
  </div>
)

export const MessagesPage = createContainer(({ organizationId }) => {
  const handle = Meteor.subscribe('messages')

  let messages = []

  if (handle.ready()) {
    messages = Messages.find({}, { sort: { createdAt: -1 }}).fetch()
    CampaignContacts.find().fetch()
  }

  let threads = groupBy(messages, (message) => message.contactNumber)
  threads = toPairs(threads).map(([contactNumber, messageList]) => last(messageList))
  threads.map((msg) => (console.log("msg and cmp cotact", msg, msg.campaignContact())))

  return {
    organizationId,
    threads,
    loading: !handle.ready()
  }
}, Page)
