export * from './user'
import { assignmentCache } from './assignment'
import { organizationCache } from './organization'
import { cannedResponseCache } from './canned-response'
import { campaignCache } from './campaign'
import { campaignContactCache } from './campaign-contact'
import { messageCache } from './message'
import { optOutCache } from './opt-out'

const cacheableData = {
  assignment: assignmentCache,
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  message: messageCache,
  optOut: optOutCache,
  organization: organizationCache
}

export {
  cacheableData
}
