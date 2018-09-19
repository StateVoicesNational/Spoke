export * from './user'
import { assignmentCache } from './assignment'
import { cannedResponseCache } from './canned-response'
import { campaignCache } from './campaign'
import { campaignContactCache } from './campaign-contact'
import { optOutCache } from './opt-out'
import { organizationCache } from './organization'
import questionResponseCache from './question-response'

const cacheableData = {
  assignment: assignmentCache,
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache,
  questionResponse: questionResponseCache
}

export {
  cacheableData
}
