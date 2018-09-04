import { r } from '../../models'

export async function hasAssignment(userId, assignmentId) {
}

export const assignmentCache = {
  clear: async (id) => {
  },
  load: async (id) => {
    // should load cache of campaign by id separately, so that can be updated on campaign-save
    // e.g. for script changes
    // should include:
    // texter: id, firstName, lastName, assignedCell, ?userCannedResponses
    // campaignId
    // organizationId
    // ?should contact ids be key'd off of campaign or assignment?
  }
}
