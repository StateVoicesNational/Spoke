import React from 'react'
import { List, ListItem } from 'material-ui/List'
import { createContainer } from 'meteor/react-meteor-data'
import { AppNavigation } from '../../ui/components/navigation'
import { Messages } from '../../api/messages/messages'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'
import { moment } from 'meteor/momentjs:moment'
import { groupBy, toPairs, last } from 'lodash'
import { displayName } from '../../api/users/users'
import ChatBubble from 'material-ui/svg-icons/communication/chat-bubble';
import { Empty } from '../components/empty'
import { AppPage } from '../../ui/layouts/app_page'
import { FlowRouter } from 'meteor/kadira:flow-router'

const Page = ({ threads, organizationId }) => (
  <AppPage
    navigation={
      <AppNavigation
        organizationId={organizationId}
        title="Messages"
      />
    }
    content={
      <div>
        {threads.length === 0 ? (
          <Empty
            title="No conversations yet"
            icon={<ChatBubble />}
          />
        ) : (
          <List>
            {threads.map((message) => (
              <ListItem
                key={message._id}
                onTouchTap={() => FlowRouter.go('message', { campaignContactId: message.campaignContact()._id, organizationId })}
                primaryText={displayName(message.campaignContact())}
                secondaryText={`${message.text}`}
                secondaryTextLines={2}
              />
            ))}
          </List>
        )}
      </div>
    }
  />
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

  return {
    organizationId,
    threads,
    loading: !handle.ready()
  }
}, Page)
