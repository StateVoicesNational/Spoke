import { organizationCache } from './organization'
import { cannedResponseCache } from './canned-response'
import { campaignCache } from './campaign'
import { campaignContactCache } from './campaign-contact'
import { optOutCache } from './opt-out'
import { userCache } from './user'

const cacheableData = {
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache,
  user: userCache
}

export {
  cacheableData
}
