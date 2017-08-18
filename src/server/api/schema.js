import { Campaign,
  CannedResponse,
  Invite,
  Message,
  OptOut,
  Organization,
  QuestionResponse,
  UserOrganization,
  JobRequest,
  r
} from '../models'
import {
  schema as userSchema,
  resolvers as userResolvers
} from './user'
import {
  schema as organizationSchema,
  resolvers as organizationResolvers
} from './organization'
import {
  schema as campaignSchema,
  resolvers as campaignResolvers
} from './campaign'
import {
  schema as assignmentSchema,
  resolvers as assignmentResolvers
} from './assignment'
import {
  schema as interactionStepSchema,
  resolvers as interactionStepResolvers
} from './interaction-step'
import {
  schema as questionSchema,
  resolvers as questionResolvers
} from './question'
import {
  schema as questionResponseSchema,
  resolvers as questionResponseResolvers
} from './question-response'
import {
  schema as dateSchema,
  resolvers as dateResolvers
} from './date'
import {
  schema as jsonSchema,
  resolvers as jsonResolvers
} from './json'
import {
  schema as phoneSchema,
  resolvers as phoneResolvers
} from './phone'
import {
  schema as optOutSchema,
  resolvers as optOutResolvers
} from './opt-out'
import {
  schema as messageSchema,
  resolvers as messageResolvers
} from './message'
import {
  schema as campaignContactSchema,
  resolvers as campaignContactResolvers
} from './campaign-contact'
import {
  schema as cannedResponseSchema,
  resolvers as cannedResponseResolvers
} from './canned-response'
import {
  schema as inviteSchema,
  resolvers as inviteResolvers
} from './invite'
import {
  GraphQLError,
  authRequired,
  accessRequired,
  assignmentRequired,
  superAdminRequired
} from './errors'
import nexmo from './lib/nexmo'
import twilio from './lib/twilio'
import { gzip, log } from '../../lib'
// import { isBetweenTextingHours } from '../../lib/timezones'
import { Notifications, sendUserNotification } from '../notifications'
import { uploadContacts, createInteractionSteps, assignTexters } from '../../workers/jobs'
const uuidv4 = require('uuid').v4

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS
const serviceMap = { nexmo, twilio }

const rootSchema = `
  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    zip: String
    customFields: String
  }

  input OptOutInput {
    assignmentId: String!
    cell: Phone!
  }

  input QuestionResponseInput {
    campaignContactId: String!
    interactionStepId: String!
    value: String!
  }

  input AnswerOptionInput {
    value: String!
    nextInteractionStepId: String
  }

  input InteractionStepInput {
    id: String
    question: String
    script: String
    answerOptions: [AnswerOptionInput]
  }

  input TexterInput {
    id: String
    needsMessageCount: Int
  }

  input CampaignInput {
    title: String
    description: String
    dueBy: Date
    contacts: [CampaignContactInput]
    organizationId: String
    texters: [TexterInput]
    interactionSteps: [InteractionStepInput]
    cannedResponses: [CannedResponseInput]
  }

  input MessageInput {
    text: String
    contactNumber: Phone
    assignmentId: String
    userId: String
  }

  input InviteInput {
    id: String
    is_valid: Boolean
    hash: String
    created_at: Date
  }

  type RootQuery {
    currentUser: User
    organization(id:String!): Organization
    campaign(id:String!): Campaign
    inviteByHash(hash:String!): [Invite]
    contact(id:String!): CampaignContact
    assignment(id:String!): Assignment
    organizations: [Organization]
  }

  type RootMutation {
    createInvite(invite:InviteInput!): Invite
    createCampaign(campaign:CampaignInput!): Campaign
    editCampaign(id:String!, campaign:CampaignInput!): Campaign
    exportCampaign(id:String!): JobRequest
    createCannedResponse(cannedResponse:CannedResponseInput!): CannedResponse
    createOrganization(name: String!, userId: String!, inviteId: String!): Organization
    joinOrganization(organizationUuid: String!): Organization
    editOrganizationRoles(organizationId: String!, userId: String!, roles: [String]): Organization
    updateTextingHours( organizationId: String!, textingHoursStart: Int!, textingHoursEnd: Int!): Organization
    updateTextingHoursEnforcement( organizationId: String!, textingHoursEnforced: Boolean!): Organization
    sendMessage(message:MessageInput!, campaignContactId:String!): CampaignContact,
    createOptOut(optOut:OptOutInput!, campaignContactId:String!):CampaignContact,
    editCampaignContactMessageStatus(messageStatus: String!, campaignContactId:String!): CampaignContact,
    deleteQuestionResponses(interactionStepIds:[String], campaignContactId:String!): CampaignContact,
    updateQuestionResponses(questionResponses:[QuestionResponseInput], campaignContactId:String!): CampaignContact,
    startCampaign(id:String!): Campaign,
    archiveCampaign(id:String!): Campaign,
    unarchiveCampaign(id:String!): Campaign,
    sendReply(id: String!, message: String!): CampaignContact
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`

async function editCampaign(id, campaign, loaders) {
  const { title, description, dueBy, organizationId } = campaign

  const campaignUpdates = {
    id,
    title,
    description,
    due_by: dueBy,
    organization_id: organizationId
  }

  Object.keys(campaignUpdates).forEach((key) => {
    if (typeof campaignUpdates[key] === 'undefined') {
      delete campaignUpdates[key]
    }
  })
  if (campaign.hasOwnProperty('contacts')) {
    const contactsToSave = campaign.contacts.map((datum) => {
      const modelData = {
        campaign_id: datum.campaignId,
        first_name: datum.firstName,
        last_name: datum.lastName,
        cell: datum.cell,
        custom_fields: datum.customFields,
        zip: datum.zip
      }
      modelData.campaign_id = id
      return modelData
    })
    const compressedString = await gzip(JSON.stringify(contactsToSave))
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      job_type: 'upload_contacts',
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      campaign_id: id,
      // NOTE: stringifying because compressedString is a binary buffer
      payload: compressedString.toString('base64')
    })
    if (JOBS_SAME_PROCESS) {
      uploadContacts(job).then()
    }
  }
  if (campaign.hasOwnProperty('texters')) {
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      job_type: 'assign_texters',
      campaign_id: id,
      payload: JSON.stringify({
        id,
        texters: campaign.texters
      })
    })

    if (JOBS_SAME_PROCESS) {
      assignTexters(job).then()
    }
  }
  if (campaign.hasOwnProperty('interactionSteps')) {
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      job_type: 'create_interaction_steps',
      campaign_id: id,
      payload: JSON.stringify({
        id,
        interaction_steps: campaign.interactionSteps
      })
    })

    if (JOBS_SAME_PROCESS) {
      createInteractionSteps(job).then()
    }
  }

  if (campaign.hasOwnProperty('cannedResponses')) {
    const cannedResponses = campaign.cannedResponses
    const convertedResponses = []
    for (let index = 0; index < cannedResponses.length; index++) {
      const response = cannedResponses[index]
      const newId = await Math.floor(Math.random()*10000000)
      convertedResponses.push({
        ...response,
        campaign_id: id,
        id: newId
      })
    }

    await r.table('canned_response').getAll(id, { index: 'campaign_id' })
      .filter({ user_id: '' })
      .delete()
    await CannedResponse.save(convertedResponses)
  }

  const newCampaign = await Campaign.get(id).update(campaignUpdates)
  return newCampaign || loaders.campaign.load(id)
}

const rootMutations = {
  RootMutation: {
    sendReply: async (_, { id, message }, { loaders }) => {
      if (process.env.NODE_ENV !== 'development') {
        throw new GraphQLError({
          status: 400,
          message: 'You cannot send manual replies unless you are in development'
        })
      }
      const contact = await loaders.campaignContact.load(id)

      const lastMessage = await r.table('message')
        .getAll(contact.assignment_id, { index: 'assignment_id' })
        .filter({ contact_number: contact.cell })
        .limit(1)(0)
        .default(null)

      if (!lastMessage) {
        throw new GraphQLError({
          status: 400,
          message: 'Cannot fake a reply to a contact that has no existing thread yet'
        })
      }

      const userNumber = lastMessage.user_number
      const contactNumber = contact.cell
      const mockedId = `mocked_${Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')}`
      if (lastMessage.service === 'nexmo') {
        await nexmo.handleIncomingMessage({
          to: userNumber,
          msisdn: contactNumber,
          text: message,
          messageId: mockedId
        })
      } else {
        await twilio.handleTwilioIncomingMessage({
          From: contactNumber,
          To: userNumber,
          Body: message,
          MessageSid: `mocked_${Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')}`
        })
      }
      return loaders.campaignContact.load(id)
    },
    exportCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = loaders.campaign.load(id)
      const organizationId = campaign.organization_id
      await accessRequired(user, organizationId, 'ADMIN')
      const newJob = await JobRequest.save({
        queue_name: `${id}:export`,
        job_type: 'export',
        locks_queue: false,
        campaign_id: id,
        payload: JSON.stringify({
          id,
          requester: user.id
        })
      })
      return newJob
    },
    editOrganizationRoles: async (_, { userId, organizationId, roles }, { user, loaders }) => {
      const currentRoles = r.table('user_organization')
        .getAll([organizationId, user.id], { index: 'organization_user' })
        .pluck('role')('role')
      const oldRoleIsOwner = currentRoles.indexOf('OWNER') !== -1
      const newRoleIsOwner = roles.indexOf('OWNER') !== -1
      const roleRequired = (oldRoleIsOwner || newRoleIsOwner) ? 'OWNER' : 'ADMIN'
      let newOrgRoles = []

      await accessRequired(user, organizationId, roleRequired)

      currentRoles.forEach(async (curRole) => {
        if (roles.indexOf(curRole) === -1) {
          await r.table('user_organization')
            .getAll([organizationId, user.id], { index: 'organization_user' })
            .filter({ role: curRole })
            .delete()
        }
      })

      newOrgRoles = roles.filter((newRole) => (currentRoles.indexOf(newRole) === -1))
        .map((newRole) => ({
          organization_id: organizationId,
          user_id: userId,
          role: newRole
        }))
      if (newOrgRoles.length) {
        await UserOrganization.save(newOrgRoles, { conflict: 'update' })
      }
      return loaders.organization.load(organizationId)
    },
    joinOrganization: async (_, { organizationUuid }, { user, loaders }) => {
      let organization
      [organization] = await r.knex('organization')
        .where('uuid', organizationUuid)
      if (organization) {
        const userOrg = await r.table('user_organization')
          .getAll(user.id, { index: 'user_id' })
          .filter({ organization_id: organization.id })
          .limit(1)(0)
          .default(null)

        if (!userOrg) {
          await UserOrganization.save({
            user_id: user.id,
            organization_id: organization.id,
            role: 'TEXTER'
          })
        }
      }
      return organization
    },
    updateTextingHours: async (_, { organizationId, textingHoursStart, textingHoursEnd }, { user }) => {
      await accessRequired(user, organizationId, 'OWNER')

      await Organization
        .get(organizationId)
        .update({
          texting_hours_start: textingHoursStart,
          texting_hours_end: textingHoursEnd
        })

      return await Organization.get(organizationId)
    },
    updateTextingHoursEnforcement: async (_, { organizationId, textingHoursEnforced }, { user }) => {
      await accessRequired(user, organizationId, 'OWNER')

      await Organization
        .get(organizationId)
        .update({
          texting_hours_enforced: textingHoursEnforced
        })

      return await Organization.get(organizationId)
    },
    createInvite: async (_, {}) => {
      const inviteInstance = new Invite({
        is_valid: true,
        hash: uuidv4(),
      })
      const newInvite = await inviteInstance.save()
      return newInvite
    },
    createCampaign: async (_, { campaign }, { user, loaders }) => {
      await accessRequired(user, campaign.organizationId, 'ADMIN')
      const campaignInstance = new Campaign({
        organization_id: campaign.organizationId,
        title: campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false
      })
      const newCampaign = await campaignInstance.save()
      return editCampaign(newCampaign.id, campaign, loaders)
    },
    unarchiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organizationId, 'ADMIN')
      campaign.is_archived = false
      await campaign.save()
      return campaign
    },
    archiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organizationId, 'ADMIN')
      campaign.is_archived = true
      await campaign.save()
      return campaign
    },
    startCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organizationId, 'ADMIN')
      campaign.is_started = true
      await campaign.save()
      await sendUserNotification({
        type: Notifications.CAMPAIGN_STARTED,
        campaignId: id
      })
      return campaign
    },
    editCampaign: async (_, { id, campaign }, { user, loaders }) => {
      if (campaign.organizationId) {
        await accessRequired(user, campaign.organizationId, 'ADMIN')
      } else {
        const campaignCheck = await Campaign.get(id)
        await accessRequired(user, campaignCheck.organization_id, 'ADMIN')
      }
      return editCampaign(id, campaign, loaders)
    },
    createCannedResponse: async (_, { cannedResponse }, { user, loaders }) => {
      authRequired(user)

      const cannedResponseInstance = new CannedResponse({
        campaign_id: cannedResponse.campaignId,
        user_id: cannedResponse.userId,
        title: cannedResponse.title,
        text: cannedResponse.text
      }).save()
      //deletes duplicate created canned_responses
      let query = r.knex('canned_response')
        .where('text', 'in',
          r.knex('canned_response')
            .where({
              text: cannedResponse.text,
              campaign_id: cannedResponse.campaignId
            })
            .select('text')
        ).andWhere({ user_id: cannedResponse.userId })
        .del()
      await query
    },
    createOrganization: async (_, { name, userId, inviteId }, { loaders, user }) => {
      authRequired(user)
      const invite = await loaders.invite.load(inviteId)
      if (!invite || !invite.is_valid) {
        throw new GraphQLError({
          status: 400,
          message: 'That invitation is no longer valid'
        })
      }

      const newOrganization = await Organization.save({
        name: name,
        uuid: uuidv4()
      })
      await UserOrganization.save(
        ['OWNER', 'ADMIN', 'TEXTER'].map((role) => ({
          user_id: userId,
          organization_id: newOrganization.id,
          role
        })))
      await Invite.save({
        id: inviteId,
        is_valid: false
      }, { conflict: 'update' })

      return newOrganization
    },
    editCampaignContactMessageStatus: async(_, { messageStatus, campaignContactId }, { loaders, user }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)
      contact.message_status = messageStatus
      return await contact.save()
    },
    createOptOut: async(_, { optOut, campaignContactId }, { loaders }) => {
      const { assignmentId, cell } = optOut
      const campaign = await r.table('assignment')
        .get(assignmentId)
        .eqJoin('campaign_id', r.table('campaign'))('right')
      await new OptOut({
        assignment_id: assignmentId,
        organization_id: campaign.organization_id,
        cell
      }).save()

      await r.table('campaign_contact')
        .getAll(cell, { index: 'cell' })
        .eqJoin('campaign_id', r.table('campaign'))
        .filter({ organization_id: campaign.organization_id})
        .update({ is_opted_out: true })

      return loaders.campaignContact.load(campaignContactId)
    },
    sendMessage: async(_, { message, campaignContactId }, { loaders }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      const campaign = await loaders.campaign.load(contact.campaign_id)
      if (contact.assignment_id !== parseInt(message.assignmentId) || campaign.is_archived) {
        throw new GraphQLError({
          status: 400,
          message: 'Your assignment has changed'
        })
      }
      const organization = await r.table('campaign')
        .get(contact.campaign_id)
        .eqJoin('organization_id', r.table('organization'))('right')

      const optOut = await r.table('opt_out')
          .getAll(contact.cell, { index: 'cell' })
          .filter({ organization_id: organization.id })
          .limit(1)(0)
          .default(null)
      if (optOut) {
        throw new GraphQLError({
          status: 400,
          message: 'Skipped sending because this contact was already opted out'
        })
      }

      // const zipData = await r.table('zip_code')
      //   .get(contact.zip)
      //   .default(null)

      // const config = {
      //   textingHoursEnforced: organization.texting_hours_enforced,
      //   textingHoursStart: organization.texting_hours_start,
      //   textingHoursEnd: organization.texting_hours_end,
      // }
      // const offsetData = zipData ? { offset: zipData.timezone_offset, hasDST: zipData.has_dst } : null
      // if (!isBetweenTextingHours(offsetData, config)) {
      //   throw new GraphQLError({
      //     status: 400,
      //     message: "Skipped sending because it's now outside texting hours for this contact"
      //   })
      // }

      const { contactNumber, text } = message

      const replaceCurlyApostrophes = (rawText) => rawText
        .replace(/[\u2018\u2019]/g, "'")

      const messageInstance = new Message({
        text: replaceCurlyApostrophes(text),
        contact_number: contactNumber,
        user_number: '',
        assignment_id: message.assignmentId,
        send_status: (JOBS_SAME_PROCESS ? 'SENDING' : 'QUEUED'),
        is_from_contact: false
      })

      await messageInstance.save()

      contact.message_status = 'messaged'
      await contact.save()

      if (JOBS_SAME_PROCESS) {
        const service = serviceMap[messageInstance.service || process.env.DEFAULT_SERVICE]
        log.info(`Sending (${service}): ${messageInstance.user_number} -> ${messageInstance.contact_number}\nMessage: ${messageInstance.text}`)
        service.sendMessage(messageInstance).then()
      }

      return contact
    },
    deleteQuestionResponses: async(_, { interactionStepIds, campaignContactId }, { loaders }) => {
      await r.table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .getAll(...interactionStepIds, { index: 'interaction_step_id' })
        .delete()

      const contact = loaders.campaignContact.load(campaignContactId)
      return contact
    },
    updateQuestionResponses: async(_, { questionResponses, campaignContactId }, { loaders }) => {
      const count = questionResponses.length

      for (let i = 0; i < count; i++) {
        const questionResponse = questionResponses[i]
        const { interactionStepId, value } = questionResponse
        await r.table('question_response')
          .getAll(campaignContactId, { index: 'campaign_contact_id' })
          .filter({ interaction_step_id: interactionStepId })
          .delete()

        await new QuestionResponse({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStepId,
          value
        }).save()
      }


      const contact = loaders.campaignContact.load(campaignContactId)
      return contact
    }
  }
}

const rootResolvers = {
  RootQuery: {
    campaign: async (_, { id }, { loaders, user }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'ADMIN')
      return campaign
    },
    assignment: async (_, { id }, { loaders, user }) => {
      const assignment = await loaders.assignment.load(id)
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      await accessRequired(user, campaign.organization_id, 'TEXTER')
      return assignment
    },
    organization: async(_, { id }, { loaders }) =>
      loaders.organization.load(id),
    inviteByHash: async (_, { hash }, { loaders, user }) => {
      authRequired(user)
      return r.table('invite').filter({"hash": hash})
    },
    currentUser: async(_, { id }, { user }) => user,
    contact: async(_, { id }, { loaders }) => {
      const contact = await loaders.campaignContact.load(id)
      // await accessRequired(user, contact.organization_id, 'TEXTER')
      return contact
    },
    organizations: async(_, { id }, { user }) => {
      await superAdminRequired(user)
      return r.table('organization')
    }
  }
}

export const schema = [
  rootSchema,
  userSchema,
  organizationSchema,
  dateSchema,
  jsonSchema,
  phoneSchema,
  campaignSchema,
  assignmentSchema,
  interactionStepSchema,
  optOutSchema,
  messageSchema,
  campaignContactSchema,
  cannedResponseSchema,
  questionResponseSchema,
  questionSchema,
  inviteSchema
]

export const resolvers = {
  ...rootResolvers,
  ...userResolvers,
  ...organizationResolvers,
  ...campaignResolvers,
  ...assignmentResolvers,
  ...interactionStepResolvers,
  ...optOutResolvers,
  ...messageResolvers,
  ...campaignContactResolvers,
  ...cannedResponseResolvers,
  ...questionResponseResolvers,
  ...inviteResolvers,
  ...dateResolvers,
  ...jsonResolvers,
  ...phoneResolvers,
  ...questionResolvers,
  ...rootMutations
}
