import { ValidatedMethod } from 'meteor/mdg:validated-method'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'
import { Scripts, ScriptTypes } from './scripts.js'

export const insert = new ValidatedMethod({
  name: 'scripts.insert',
  validate: new SimpleSchema({
    title: { type: String },
    text: { type: String },
    campaignId: { type: String },
  }).validator(),
  run({ title, text, campaignId, type }) {
    const script = {
      title,
      text,
      campaignId,
      type: ScriptTypes.FAQ, // Remove this
      createdAt: new Date(),
      userId: this.userId
    }

    Scripts.insert(script)
  }
})