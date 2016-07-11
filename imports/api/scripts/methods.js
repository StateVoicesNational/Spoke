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
  run({ title, text, campaignId }) {
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

export const update = new ValidatedMethod({
  name: 'scripts.update',
  validate: new SimpleSchema({
    title: { type: String },
    text: { type: String },
    scriptId: { type: String }
  }).validator(),
  run({ title, text, scriptId }) {
    // FIXME: authorization

    Scripts.update({_id: scriptId}, {$set: { title, text } })
  }
})

export const remove = new ValidatedMethod({
  name: 'scripts.remove',
  validate: new SimpleSchema({
    scriptId: { type: String }
  }).validator(),
  run({ scriptId }) {
    // FIXME: authorization
    // CANNOT EDIT OR DELETE a global script
    console.log("removing ", scriptId)
    Scripts.remove({ _id: scriptId })
  }
})