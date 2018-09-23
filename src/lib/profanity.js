export function isProfane(messageText) {
  // TODO(lperson) future: return different categories, such as profane, abusive, etc.
  const profanity = /.*fuck.*/i
  return profanity.test(messageText)
}