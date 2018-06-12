import _ from 'lodash';
import User from '../models/user';
import CampaignContact from '../models/campaign-contact';

export const schema = `
  input ConversationFilter {
    assignmentsFilter: AssignmentsFilter
    campaignsFilter: CampaignsFilter
    contactsFilter: ContactsFilter
  }

  type Conversation {
    texter: User!
    contact: CampaignContact!
  }
`;

export const resolvers = {
  Conversation: {
    'texter': (instance) => {
      const fields = _.remove(Object.keys(User._schema._schema), el === 'id'),
            texterFields = _.pick(instance, fields);
      texterFields.id = instance['texterId'];
      return texterFields;
    },
    'contact': (instance) => {
      const fields = _.remove(Object.keys(CampaignContact._schema._schema), el === 'id'),
            contactFields = _.pick(instance, fields);
      contactFields.id = instance['contactId'];
      return contactFields;
    },
  },
};
