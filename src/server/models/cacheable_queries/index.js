export * from './user'
import { organizationCache } from './organization'
import { cannedResponseCache } from './canned-response'

export const cacheableData = {
  organization: organizationCache,
  cannedResponse: cannedResponseCache
}
