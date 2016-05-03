import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Campaigns } from './campaigns.js';

export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    description: { type: String },
  }).validator(),
  run({ title, description }) {
    const campaign = {
      title,
      description,
      script: 'Hi here is a script',
      createdAt: new Date(),
      customFields: ['hi', 'bye', 'smee']
    };

    Campaigns.insert(campaign);
  }
});