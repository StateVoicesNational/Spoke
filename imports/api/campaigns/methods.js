import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { insertContact } from '../campaign_contacts/methods'

import { Campaigns } from './campaigns.js';
import { CampaignContacts } from '../campaign_contacts/campaign_contacts.js';

// TODO I should actually do the campaignContact validation here so I don't have
// a chance of failing between campaign save and contact save
export const insert = new ValidatedMethod({
  name: 'campaigns.insert',
  validate: new SimpleSchema({
    title: { type: String },
    description: { type: String },
    contacts: { type: [Object], blackbox: true },
    script: { type: String }
  }).validator(),
  run({ title, description, contacts, script }) {
    const campaignData = {
      title,
      description,
      script,
      createdAt: new Date(),
      customFields: ['hi', 'bye', 'smee']
    };

    // TODO do this only if the contacst validate!
    Campaigns.insert(campaignData, (campaignError, campaignId) => {
      for (let row of contacts) {
        // TODO: Require upload in this format.
        const contact = { campaignId }

        for (let requiredField of CampaignContacts.requiredUploadFields) {
          contact[requiredField] = row[requiredField]
          delete row[requiredField]
        }

        contact.customFields = row
        // TODO BBulk insert instead of individual!
        insertContact.call(contact, (contactError) => {
          if (contactError) {
            console.log("failed to insert", contactError)
          }
          else {
            console.log("inserted contact?")
          }
        })
      }
    })
  }
})