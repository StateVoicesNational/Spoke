import _ from 'lodash'
import User from '../models/user'
import CampaignContact from '../models/campaign-contact'

export const schema = `
  input ConversationFilter {
    assignmentsFilter: AssignmentsFilter
    campaignsFilter: CampaignsFilter
    contactsFilter: ContactsFilter
  }

  type Conversation {
    texter: User!
    contact: CampaignContact!
    campaign: Campaign!
    assignment: Assignment
  }
  
  type PaginatedConversations {
    conversations: [Conversation]!
    pageInfo: PageInfo
  }
`

function coerceQueryFieldsToResolverFields(instance, fieldsToRemove) {
  const fields = _.remove(Object.keys(instance), el => {
    return !fieldsToRemove.includes(el)
  })
  return _.pick(instance, fields)
}

export const resolvers = {
  PaginatedConversations: {
    conversations: instance => {
      return instance.conversations
    },
    pageInfo: instance => {
      if ('pageInfo' in instance) {
        return instance.pageInfo
      } else {
        return null
      }
    }
  },
  Conversation: {
    texter: instance => {
      const texterFields = coerceQueryFieldsToResolverFields(instance, [
        'u_id',
        'u_first_name',
        'u_last_name'
      ])
      texterFields.id = instance.u_id
      texterFields.last_name = instance.u_first_name
      texterFields.first_name = instance.u_last_name
      return texterFields
    },
    contact: instance => {
      const contactFields = coerceQueryFieldsToResolverFields(instance, [
        'cc_id',
        'cc_first_name',
        'cc_last_name'
      ])
      contactFields.id = instance.cc_id
      contactFields.first_name = instance.cc_first_name
      contactFields.last_name = instance.cc_last_name
      return contactFields
    },
    campaign: instance => {
      const campaignFields = coerceQueryFieldsToResolverFields(instance, ['cmp_id'])
      campaignFields.id = instance.cmp_id
      return campaignFields
    },
    assignment: instance => {
      const assignmentFields = coerceQueryFieldsToResolverFields(instance, ['ass_id'])
      assignmentFields.id = instance.ass_id
      return assignmentFields
    }
  }
}
