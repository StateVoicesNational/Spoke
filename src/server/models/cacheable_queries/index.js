export * from './user'
import { organizationCache } from './organization'
import { cannedResponseCache } from './canned-response'
import { campaignCache } from './campaign'
import { campaignContactCache } from './campaign-contact'
import { optOutCache } from './opt-out'

const cacheableData = {
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache,
}

export {
  cacheableData
}
