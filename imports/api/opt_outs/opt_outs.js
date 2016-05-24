import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { CampaignContacts } from '../campaign_contacts/campaign_contacts'
export const OptOuts = new Mongo.Collection('opt_outs')

OptOuts.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
})

OptOuts.schema = new SimpleSchema({
  cell: { type: String },
  createdAt: { type: String },
  assignmentId: { type: String }
})

OptOuts.helpers({
    contact() {
        return CampaignContacts.findOne({_id: this.campaignContactId})
    }
})