export * from './user'
import { organizationCache } from './organization'
import { cannedResponseCache } from './canned-response'
import { campaignContactCache } from './campaign-contact'

const cacheableData = {
  organization: organizationCache,
  cannedResponse: cannedResponseCache,
  campaignContact: campaignContactCache
}

export {
  cacheableData
}
