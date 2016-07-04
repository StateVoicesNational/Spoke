import { CampaignContacts } from '../campaign_contacts/campaign_contacts'
import { Mongo } from 'meteor/mongo'
import { SimpleSchema } from 'meteor/aldeed:simple-schema'

export const ScriptTypes = {
    INITIAL: 'initial', // First time contacting a supporter
    REPEAT: 'repeat', // Contact who has been texted before
    FAQ: 'faq' // FAQ script
}

export const Scripts = new Mongo.Collection('scripts')

export const ScriptSchema = new SimpleSchema({
  campaignId: { type: String },
  userId: { type: String, optional: true },
  text: { type: String },
  title: {
    type: String,
    optional: true,
    custom: function () {
      var shouldBeRequired = this.field('type').value == ScriptTypes.FAQ

      if (shouldBeRequired) {
        // inserts
        if (!this.operator) {
          if (!this.isSet || this.value === null || this.value === "") return "required";
        }

        // updates
        else if (this.isSet) {
          if (this.operator === "$set" && this.value === null || this.value === "") return "required";
          if (this.operator === "$unset") return "required";
          if (this.operator === "$rename") return "required";
        }
      }
    }
  },
  type: {
    type: String,
    allowedValues: [
      ScriptTypes.INITIAL,
      ScriptTypes.REPEAT,
      ScriptTypes.FAQ
    ]
  }
})

Scripts.schema = ScriptSchema

export const delimiters = {
  startDelimiter: '{',
  endDelimiter: '}'
}

export const delimit = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  return `${startDelimiter}${text}${endDelimiter}`
}

// TODO: This will include zipCode even if you ddin't upload it
export const allScriptFields = (customFields) => CampaignContacts.topLevelUploadFields.concat(CampaignContacts.userScriptFields).concat(customFields)