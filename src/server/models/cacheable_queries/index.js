import campaignCache from './campaign'
import cannedResponseCache from './canned-response'
import optOutCache from './opt-out'
import organizationCache from './organization'
import userCache from './user'

const cacheableData = {
  campaign: campaignCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache,
  user: userCache
}

export default cacheableData
