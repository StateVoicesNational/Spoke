import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Campaigns } from './campaigns.js';

export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    script: { type: String }
  }).validator(),
  run({ title, description, contacts, script }) {
    const campaign = {
      title,
      description,
      script,
      createdAt: new Date(),
      customFields: ['hi', 'bye', 'smee']
    };

    // TODO do this only if the contacst validate!
    Campaigns.insert(campaign)
    for (let row of contacts) {
      // TODO: Require upload in this format.
      const contact = {
        firstName: row.first_name,
        lastName: row.last_name,
        number: row.phone,
        // state: row.state,
        customFields: []
      }
    }
  }
})