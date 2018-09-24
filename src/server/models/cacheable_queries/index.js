import assignmentCache from './assignment'
import campaignContactCache from './campaign-contact'
import campaignCache from './campaign'
import cannedResponseCache from './canned-response'
import messageCache from './message'
import optOutCache from './opt-out'
import organizationCache from './organization'
import questionResponseCache from './question-response'
import userCache from './user'

const cacheableData = {
  assignment: assignmentCache,
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  message: messageCache,
  optOut: optOutCache,
  organization: organizationCache,
  questionResponse: questionResponseCache,
  user: userCache
}

export default cacheableData
