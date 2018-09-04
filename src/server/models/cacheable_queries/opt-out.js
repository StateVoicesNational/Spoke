import { r } from '../../models'

// STRUCTURE
// maybe HASH by organization, so optout-<organization_id> has a <cell> key
// Does redis have sets?  we can use them, then instead of hashes with values.

export const optoutCache = {
  clearQuery: async ({cell, organizationId}) => {
    // remove cache by organization
    // (if no cell is present, then clear whole query of organization)
  },
  query: async ({cell, organizationId}) => {
    // return optout result by db or by cache.
    // for a particular organization, if the org Id is NOT cached
    // then cache the WHOLE set of opt-outs for organizationId at once
    // and expire them in a day.
  },
  save: async ({cell, organizationId, reason}) => {
    // save an opt-out, but also update cache
  }
}

