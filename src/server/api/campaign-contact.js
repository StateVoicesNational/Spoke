import { CampaignContact, r } from '../models'
import { mapFieldsToModel } from './lib/utils'
import { getTopMostParent } from '../../lib'

export const schema = `
  input ContactsFilter {
    messageStatus: String
    isOptedOut: Boolean
    validTimezone: Boolean
  }

  type Timezone {
    offset: Int
    hasDST: Boolean
  }

  type Location {
    timezone: Timezone
    city: String
    state: String
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    zip: String
    customFields: JSON
    messages: [Message]
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponses: [AnswerOption]
    interactionSteps: [InteractionStep]
    currentInteractionStepScript: String
    currentInteractionStepId: String
    messageStatus: String
    assignmentId: String
  }
`

export const resolvers = {
  Location: {
    timezone: (zipCode) => zipCode,
    city: (zipCode) => zipCode.city,
    state: (zipCode) => zipCode.state
  },
  Timezone: {
    offset: (zipCode) => zipCode.timezone_offset,
    hasDST: (zipCode) => zipCode.has_dst,
  },
  CampaignContact: {
    ...mapFieldsToModel([
      'id',
      'firstName',
      'lastName',
      'cell',
      'zip',
      'customFields',
      'messageStatus',
      'assignmentId'
    ], CampaignContact),

    campaign: async (campaignContact, _, { loaders }) => (
      loaders.campaign.load(campaignContact.campaign_id)
    ),
    questionResponses: async (campaignContact) => (
      //TODO: what are all the questionresponses
      // -- join by value==[child]interactionstep.answer_option
      // -- also join by interaction_step_id==[parent]interactionstep: "parent_interaction_step", "contact_response_value"
      r.table('question_response')
        .getAll(campaignContact.id, { index: 'campaign_contact_id' })
        .eqJoin('interaction_step_id', r.table('interaction_step'))
        .concatMap((row) => (
          row('right')('answer_options')
            .map((option) => option.merge({
              parent_interaction_step: row('right'),
              contact_response_value: row('left')('value')
            }))
        ))
        .filter((row) => row('value').eq(row('contact_response_value')))
    ),
    //
    // QuestionResponses for the new regime. Original code returns data like these: 
    // {
    //     "contact_response_value":  "Well" ,
    //     "interaction_step_id":  "f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c" ,
    //     "parent_interaction_step": {
    //         "answer_option":  "" ,
    //         "answer_options": [
    //         {
    //             "interaction_step_id":  "f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c" ,
    //             "value":  "Well"
    //         } ,
    //         {
    //             "interaction_step_id":  "d245e461-d022-56df-bc8d-47b24254f077" ,
    //             "value":  "Poorly"
    //         }
    //         ] ,
    //         "campaign_id":  "8c429f5b-2627-47b4-9395-5814a27e403f" ,
    //         "created_at": Tue Jul 11 2017 17:18:06 GMT+00:00 ,
    //         "id":  "447570be-7984-5cc6-9e96-943c9fece330" ,
    //         "parent_interaction_id":  "" ,
    //         "question":  "How are you doing today?" ,
    //         "script":  ""
    //     } ,
    //     "value":  "Well"
    // } 
    // {
    //     "contact_response_value":  "Yes" ,
    //     "interaction_step_id":  "58d3db41-8571-548d-87dd-905a54a17090" ,
    //     "parent_interaction_step": {
    //         "answer_option":  "Well" ,
    //         "answer_options": [
    //             {
    //                 "interaction_step_id":  "1f3b68c2-54c0-5961-b4a3-3cff8632a777" ,
    //                 "value":  "No"
    //             } ,
    //             {
    //                 "interaction_step_id":  "58d3db41-8571-548d-87dd-905a54a17090" ,
    //                 "value":  "Yes"
    //             }
    //         ] ,
    //         "campaign_id":  "8c429f5b-2627-47b4-9395-5814a27e403f" ,
    //         "created_at": Tue Jul 11 2017 17:18:06 GMT+00:00 ,
    //         "id":  "f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c" ,
    //         "parent_interaction_id":  "447570be-7984-5cc6-9e96-943c9fece330" ,
    //         "question":  "Would you feed the cat?" ,
    //         "script":  "Good!"
    //     } ,
    //     "value":  "Yes"
    // }

    //
    //  New ReQL query with transitional interaction_step model looks like this:
    //  
    // const results = await r.table('question_response')
    //   .getAll(campaignContact.id, { index: 'campaign_contact_id'})
    //   .eqJoin('interaction_step_id', r.table('interaction_step'))
    //   .zip()
    //   .innerJoin(r.table('interaction_step'), function(left, right) {
    //     return left('interaction_step_id').eq(right( 'parent_interaction_id'))
    //   })
    //
    // and it returns something like this:
    //
    // {  
    //     "left":{  
    //         "answer_option":"",
    //         "answer_options":[  
    //             {  
    //                 "interaction_step_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //                 "value":"Well"
    //             },
    //             {  
    //                 "interaction_step_id":"d245e461-d022-56df-bc8d-47b24254f077",
    //                 "value":"Poorly"
    //             }
    //         ],
    //         "campaign_contact_id":"917987c3-929c-4c01-9fcd-61fbf1885edd",
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "interaction_step_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "parent_interaction_id":"",
    //         "question":"How are you doing today?",
    //         "script":"",
    //         "value":"Well"
    //     },
    //     "right":{  
    //         "answer_option":"Poorly",
    //         "answer_options":[  

    //         ],
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"d245e461-d022-56df-bc8d-47b24254f077",
    //         "parent_interaction_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "question":"",
    //         "script":"I'm sorry to hear that"
    //     }
    // }{  
    //     "left":{  
    //         "answer_option":"",
    //         "answer_options":[  
    //             {  
    //                 "interaction_step_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //                 "value":"Well"
    //             },
    //             {  
    //                 "interaction_step_id":"d245e461-d022-56df-bc8d-47b24254f077",
    //                 "value":"Poorly"
    //             }
    //         ],
    //         "campaign_contact_id":"917987c3-929c-4c01-9fcd-61fbf1885edd",
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "interaction_step_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "parent_interaction_id":"",
    //         "question":"How are you doing today?",
    //         "script":"",
    //         "value":"Well"
    //     },
    //     "right":{  
    //         "answer_option":"Well",
    //         "answer_options":[  
    //             ...
    //         ],
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "parent_interaction_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "question":"Would you feed the cat?",
    //         "script":"Good!"
    //     }
    // }{  
    //     "left":{  
    //         "answer_option":"Well",
    //         "answer_options":[  
    //             ...
    //         ],
    //         "campaign_contact_id":"917987c3-929c-4c01-9fcd-61fbf1885edd",
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "interaction_step_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "parent_interaction_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "question":"Would you feed the cat?",
    //         "script":"Good!",
    //         "value":"Yes"
    //     },
    //     "right":{  
    //         "answer_option":"No",
    //         "answer_options":[  

    //         ],
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"1f3b68c2-54c0-5961-b4a3-3cff8632a777",
    //         "parent_interaction_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "question":"",
    //         "script":"That's too bad."
    //     }
    // }{  
    //     "left":{  
    //         "answer_option":"Well",
    //         "answer_options":[  
    //             {  
    //                 "interaction_step_id":"1f3b68c2-54c0-5961-b4a3-3cff8632a777",
    //                 "value":"No"
    //             },
    //             {  
    //                 "interaction_step_id":"58d3db41-8571-548d-87dd-905a54a17090",
    //                 "value":"Yes"
    //             }
    //         ],
    //         "campaign_contact_id":"917987c3-929c-4c01-9fcd-61fbf1885edd",
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "interaction_step_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "parent_interaction_id":"447570be-7984-5cc6-9e96-943c9fece330",
    //         "question":"Would you feed the cat?",
    //         "script":"Good!",
    //         "value":"Yes"
    //     },
    //     "right":{  
    //         "answer_option":"Yes",
    //         "answer_options":[  

    //         ],
    //         "campaign_id":"8c429f5b-2627-47b4-9395-5814a27e403f",
    //         "created_at":        Tue Jul 11 2017 17:18:06        GMT+00:00,
    //         "id":"58d3db41-8571-548d-87dd-905a54a17090",
    //         "parent_interaction_id":"f4fd1978-2ad2-55a4-a8b3-f512b6b1cf7c",
    //         "question":"",
    //         "script":"Thank you!"
    //     }
    // }
    //
    // To get that result to look like what the original code returned 
    // without using the outgoing answer_options array field, try this:
    //
    // let formatted = {}
    // for (let i = 0, i < results.length, i++) {
    //     responseId = results[i].left.id
    //     if (responseId in formatted) {
    //       responseValue = results[i].left.value
    //       interactionStepId = results[i].right.id
    //       formatted.responseId.parent_interaction_step.answer_options.push({
    //         "value": responseValue,
    //         "interaction_step_id": interactionStepId
    //       })
    //     } else {
    //       responseValue = results[i].left.value
    //       interactionStepId = results[i].right.id
    //       answerOption = ''
    //       answerOptions = []
    //       answerOptions.push({
    //         "value": responseValue, 
    //         "interaction_step_id": interactionStepId
    //       })
    //       campaignId = results[i].left.campaign_id
    //       createdAt = results[i].left.created_at
    //       questionStepId = results[i].left.interaction_step_id
    //       questionStepParentInteractionId = ''
    //       question = results[i].left.question
    //       script = results[i].left.script

    //       formatted[responseId] = {
    //         "contact_response_value": responseValue,
    //         "interaction_step_id": interactionStepId,
    //         "parent_interaction_step": {
    //             "answer_option": answerOption,
    //             "answer_options": answerOptions,
    //             "campaign_id": campaignId,
    //             "created_at": createdAt,
    //             "id": responseId,
    //             "parent_interaction_id": questionStepParentInteractionId,
    //             "question": question,
    //             "script": script
    //         },
    //         "value":  "Well"
    //       } 
    //     }
    // return formatted

    location: async (campaignContact, _, { loaders }) => {
      const mainZip = campaignContact.zip.split('-')[0]
      const loc = await loaders.zipCode.load(mainZip)
      return loc
    },
    messages: async (campaignContact) => {
      const messages = await r.table('message')
        .getAll(campaignContact.assignment_id, { index: 'assignment_id' })
        .filter({
          contact_number: campaignContact.cell
        })
        .orderBy('created_at')

      return messages
    },
    optOut: async (campaignContact, _, { loaders }) => {
      const campaign = await loaders.campaign.load(campaignContact.campaign_id)

      return r.table('opt_out')
        .getAll(campaignContact.cell, { index: 'cell' })
        .filter({ organization_id: campaign.organization_id })
        .limit(1)(0)
        .default(null)
    },
    currentInteractionStepId: async (campaignContact) => {
      const steps = await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
      return getTopMostParent(steps, true).id
    },
    currentInteractionStepScript: async (campaignContact) => {
      const steps = await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
      return getTopMostParent(steps, true).script
    },
    interactionSteps: async (campaignContact) => (
      await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
    ),
  }
}
