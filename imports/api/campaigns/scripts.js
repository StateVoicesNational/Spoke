export const ScriptTypes = {
    INITIAL: 'initial', // First time contacting a supporter
    REPEAT: 'repeat', // Contact who has been texted before
    FAQ: 'faq' // FAQ script
}

export const ScriptSchema = new SimpleSchema({
  text: { type: String },
  title: {
    type: String,
    optional: true
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
