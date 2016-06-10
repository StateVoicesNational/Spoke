export const ScriptTypes = {
    INITIAL: 'initial', // First time contacting a supporter
    REPEAT: 'repeat', // Contact who has been texted before
    FAQ: 'faq' // FAQ script
}

export const ScriptSchema = new SimpleSchema({
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

export const delimiters = {
  startDelimiter: '{',
  endDelimiter: '}'
}

export const delimit = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  return `${startDelimiter}${text}${endDelimiter}`
}
