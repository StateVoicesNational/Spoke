import { applyScript } from '../../lib/scripts'
import camelCaseKeys from 'camelcase-keys'

import { 
  Assignment,
  Campaign,
  CannedResponse,
  Invite,
  Message,
  OptOut,
  Organization,
  QuestionResponse,
  UserOrganization,
  JobRequest,
  User,
  r,
  datawarehouse
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
  hasRole,
  assignmentRequired,
  superAdminRequired
} from './errors'
import nexmo from './lib/nexmo'
import twilio from './lib/twilio'
import { gzip, log } from '../../lib'
// import { isBetweenTextingHours } from '../../lib/timezones'
import { Notifications, sendUserNotification } from '../notifications'
import { uploadContacts,
         loadContactsFromDataWarehouse,
         createInteractionSteps,
         assignTexters,
         exportCampaign
       } from '../../workers/jobs'
const uuidv4 = require('uuid').v4

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS
const serviceMap = { nexmo, twilio }

const rootSchema = `
  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    zip: String
    external_id: String
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
    action: String
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
    maxContacts: Int
  }

  input CampaignInput {
    title: String
    description: String
    dueBy: Date
    useDynamicAssignment: Boolean
    contacts: [CampaignContactInput]
    contactSql: String
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

  input ContactMessage {
    message: MessageInput!,
    campaignContactId: String!
  }

  type Action {
    name: String
    display_name: String
  }

  type RootQuery {
    currentUser: User
    organization(id:String!): Organization
    campaign(id:String!): Campaign
    inviteByHash(hash:String!): [Invite]
    contact(id:String!): CampaignContact
    assignment(id:String!): Assignment
    organizations: [Organization]
    availableActions: [Action]
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
    bulkSendMessages(assignmentId: Int!): [CampaignContact]
    sendMessage(message:MessageInput!, campaignContactId:String!): CampaignContact,
    createOptOut(optOut:OptOutInput!, campaignContactId:String!):CampaignContact,
    editCampaignContactMessageStatus(messageStatus: String!, campaignContactId:String!): CampaignContact,
    deleteQuestionResponses(interactionStepIds:[String], campaignContactId:String!): CampaignContact,
    updateQuestionResponses(questionResponses:[QuestionResponseInput], campaignContactId:String!): CampaignContact,
    startCampaign(id:String!): Campaign,
    archiveCampaign(id:String!): Campaign,
    unarchiveCampaign(id:String!): Campaign,
    sendReply(id: String!, message: String!): CampaignContact
    findNewCampaignContact(assignmentId: String!, numberContacts: Int!): CampaignContact,
    assignUserToCampaign(campaignId: String!): Campaign
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`

async function editCampaign(id, campaign, loaders, user) {
  const { title, description, dueBy, organizationId, useDynamicAssignment } = campaign
  const campaignUpdates = {
    id,
    title,
    description,
    due_by: dueBy,
    organization_id: organizationId,
    use_dynamic_assignment: useDynamicAssignment
  }

  Object.keys(campaignUpdates).forEach((key) => {
    if (typeof campaignUpdates[key] === 'undefined') {
      delete campaignUpdates[key]
    }
  })

  if (campaign.hasOwnProperty('contacts') && campaign.contacts) {
    const contactsToSave = campaign.contacts.map((datum) => {
      const modelData = {
        campaign_id: datum.campaignId,
        first_name: datum.firstName,
        last_name: datum.lastName,
        cell: datum.cell,
        external_id: datum.external_id,
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
  if (campaign.hasOwnProperty('contactSql')
      && datawarehouse
      && user.is_superadmin) {
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      job_type: 'upload_contacts_sql',
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      campaign_id: id,
      payload: campaign.contactSql
    })
    if (JOBS_SAME_PROCESS) {
      loadContactsFromDataWarehouse(job).then()
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

    // assign the maxContacts
    campaign.texters.forEach(async (texter) => {
      const dog = r.knex('campaign').where({id: id}).select('useDynamicAssignment')
      console.log({user_id: texter.id, campaign_id: id, maxContacts: texter.maxContacts})
      await r.knex('assignment')
        .where({user_id: texter.id, campaign_id: id})
        .update({max_contacts: texter.maxContacts ? texter.maxContacts : null})
    });
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
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: id,
        payload: JSON.stringify({
          id,
          requester: user.id
        })
      })
      if (JOBS_SAME_PROCESS) {
        exportCampaign(newJob).then()
      }
      return newJob
    },
    editOrganizationRoles: async (_, { userId, organizationId, roles }, { user, loaders }) => {
      const currentRoles = await r.table('user_organization')
        .getAll([organizationId, userId], { index: 'organization_user' })
        .pluck('role')('role')

      const oldRoleIsOwner = currentRoles.indexOf('OWNER') !== -1
      const newRoleIsOwner = roles.indexOf('OWNER') !== -1
      const roleRequired = (oldRoleIsOwner || newRoleIsOwner) ? 'OWNER' : 'ADMIN'
      let newOrgRoles = []

      await accessRequired(user, organizationId, roleRequired)

      currentRoles.forEach(async (curRole) => {
        if (roles.indexOf(curRole) === -1) {
          await r.table('user_organization')
            .getAll([organizationId, userId], { index: 'organization_user' })
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
    assignUserToCampaign: async (_, { campaignId }, { user, loaders }) => {
      let campaign
      [campaign] = await r.knex('campaign')
        .where('id', campaignId)
      if (campaign) {
        const assignment = await r.table('assignment')
          .getAll(user.id, { index: 'user_id' })
          .filter({ campaign_id: campaign.id })
          .limit(1)(0)
          .default(null)
        if (!assignment) {
          await Assignment.save({
            user_id: user.id,
            campaign_id: campaign.id,
            max_contacts: (process.env.DEFAULT_MAX_CONTACTS || 1)
          })
        }
      }
      return campaign
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
    createInvite: async (_, { user }) => {
      if( (user && user.is_superadmin) || !process.env.SUPPRESS_SELF_INVITE ){
        const inviteInstance = new Invite({
          is_valid: true,
          hash: uuidv4(),
        })
        const newInvite = await inviteInstance.save()
        return newInvite
      }
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
      return editCampaign(id, campaign, loaders, user)
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

    findNewCampaignContact: async(_, { assignmentId, numberContacts }, { loaders, user } ) => {
      /* This attempts to find a new contact for the assignment, in the case that useDynamicAssigment == true */
      console.log({assignmentId: assignmentId, numberContacts: numberContacts})
      const assignment = await Assignment.get(assignmentId)
      const campaign = await Campaign.get(assignment.campaign_id)
      const contactsCount = Number((await r.knex('campaign_contact').where({assignment_id: assignmentId}).select(r.knex.raw('count(*) as count')))[0].count)

      if (!campaign.use_dynamic_assignment) {
        return false
      }

      numberContacts = numberContacts || 1

      if (assignment.max_contacts && (contactsCount + numberContacts > assignment.max_contacts)){
        numberContacts = assignment.max_contacts - contactsCount
      }

      // Don't add them if they already have them
      const result = await r.knex.raw(`SELECT COUNT(*) as count FROM campaign_contact WHERE assignment_id = :assignment_id AND message_status = 'needsMessage'`, {assignment_id: assignmentId})
      if (result.rows[0].count >= numberContacts){
        return false
      } 

      const result2 = await r.knex.raw(`UPDATE campaign_contact
        SET assignment_id = :assignment_id
        WHERE id IN (
          SELECT id
          FROM campaign_contact cc
          WHERE campaign_id = :campaign_id
          AND assignment_id IS null
          LIMIT :number_contacts
        )
        RETURNING *
        `, {assignment_id: assignmentId, campaign_id: campaign.id, number_contacts: numberContacts})
      
      if (result2.rowCount > 0){
        return true
      } else {  
        return false
      }

    },

    createOptOut: async(_, { optOut, campaignContactId }, { loaders, user }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)

      const { assignmentId, cell } = optOut

      const campaign = await r.table('assignment')
        .get(assignmentId)
        .eqJoin('campaign_id', r.table('campaign'))('right')
      await new OptOut({
        assignment_id: assignmentId,
        organization_id: campaign.organization_id,
        cell
      }).save()

      await r.knex('campaign_contact')
        .whereIn('cell', function() {
          this.select('cell').from('opt_out')
        })
        .update({
          is_opted_out: true
        })

      return loaders.campaignContact.load(campaignContactId)
    },
    bulkSendMessages: async(_, { assignmentId }, loaders) => {
      if (!process.env.ALLOW_SEND_ALL) {
        log.error('Not allowed to send all messages at once')
        throw new GraphQLError({
          status: 403,
          message: 'Not allowed to send all messages at once'
        })
      }

      const assignment = await Assignment.get(assignmentId)
      const campaign = await Campaign.get(assignment.campaign_id)
      // Assign some contacts
      await rootMutations.RootMutation.findNewCampaignContact(_, { assignmentId: assignmentId, numberContacts: process.env.BULK_SEND_CHUNK_SIZE } , loaders)

      const contacts = await r.knex('campaign_contact')
        .where({message_status: 'needsMessage'})
        .where({assignment_id: assignmentId})
        .limit(process.env.BULK_SEND_CHUNK_SIZE)

      const texter = camelCaseKeys(await User.get(assignment.user_id))
      const customFields = Object.keys(JSON.parse(contacts[0].custom_fields))

      const contactMessages = await contacts.map( async (contact) => {
        const script = await campaignContactResolvers.CampaignContact.currentInteractionStepScript(contact)
        contact.customFields = contact.custom_fields
        const text = applyScript({
          contact: camelCaseKeys(contact),
          texter,
          script,
          customFields
        })
        const contactMessage = {
          contactNumber: contact.cell,
          userId: assignment.user_id,
          text,
          assignmentId
        }
        await rootMutations.RootMutation.sendMessage(_, {message: contactMessage, campaignContactId: contact.id}, loaders)
      })

      return []
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
        service: process.env.DEFAULT_SERVICE || '',
        is_from_contact: false
      })

      await messageInstance.save()

      contact.message_status = 'messaged'
      contact.updated_at = 'now()'
      await contact.save()

      if (JOBS_SAME_PROCESS) {
        const service = serviceMap[messageInstance.service || process.env.DEFAULT_SERVICE]
        log.info(`Sending (${service}): ${messageInstance.user_number} -> ${messageInstance.contact_number}\nMessage: ${messageInstance.text}`)
        service.sendMessage(messageInstance).then()
      }

      return contact
    },
    deleteQuestionResponses: async(_, { interactionStepIds, campaignContactId }, { loaders, user }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)
      await r.table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .getAll(...interactionStepIds, { index: 'interaction_step_id' })
        .delete()
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
      authRequired(user)
      const assignment = await loaders.assignment.load(id)
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      const roles = {}
      const userRoles = await r.knex('user_organization').where({
        user_id: user.id,
        organization_id: campaign.organization_id
      }).select('role')
      userRoles.forEach(role => {
        roles[role['role']] = 1
      })
      if ('OWNER' in roles
        || user.is_superadmin
        || 'TEXTER' in roles && assignment.user_id == user.id) {
        return assignment
      } else {
        throw new GraphQLError({
          status: 403,
          message: 'You are not authorized to access that resource.'
        })
      }
    },
    organization: async(_, { id }, { loaders }) =>
      loaders.organization.load(id),
    inviteByHash: async (_, { hash }, { loaders, user }) => {
      authRequired(user)
      return r.table('invite').filter({"hash": hash})
    },
    currentUser: async(_, { id }, { user }) => user,
    contact: async(_, { id }, { loaders, user }) => {
      authRequired(user)
      const contact = await loaders.campaignContact.load(id)
      const campaign = await loaders.campaign.load(contact.campaign_id)
      const roles = {}
      const userRoles = await r.knex('user_organization').where({
        user_id: user.id,
        organization_id: campaign.organization_id
      }).select('role')
      userRoles.forEach(role => {
        roles[role['role']] = 1
      })
      if ('OWNER' in roles || user.is_superadmin) {
        return contact
      } else if ('TEXTER' in roles) {
        const assignment = await loaders.assignment.load(contact.assignment_id)
        return contact
      } else {
        console.error('NOT Authorized: contact', user, roles)
        throw new GraphQLError({
          status: 403,
          message: 'You are not authorized to access that resource.'
        })
      }
    },
    organizations: async(_, { id }, { user }) => {
      await superAdminRequired(user)
      return r.table('organization')
    },
    availableActions: (_, __, { user }) => {
      if (!process.env.ACTION_HANDLERS) {
        return []
      }
      const allHandlers = process.env.ACTION_HANDLERS.split(',')
      const availableHandlers = allHandlers.filter(handler => {
        try {
          return require(`../action_handlers/${handler}.js`).available()
        }
        catch (_) {
          return false
        }
      })
      const availableHandlerObjects = availableHandlers.map(handler => {
        const handlerPath = `../action_handlers/${handler}.js`
        return {
          'name': handler,
          'display_name': require(handlerPath).displayName()
        }
      })
      return availableHandlerObjects
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
