import { r } from '../../models'

export const campaignCache = {
  clear: async (id) => {
  },
  load: async(id) => {
    // Only cache NON-archived campaigns
    //   should clear when archiving is done
    // Should include (see TexterTodo.jsx):
    // * campaignCannedResponses
    // * organization metadata
    // * interactionSteps
    // * customFields
  }
}
