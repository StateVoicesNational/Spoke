import { applyScript } from '../../lib/scripts'
import camelCaseKeys from 'camelcase-keys'
import isUrl from 'is-url'
import { buildCampaignQuery } from './campaign'

import {
  Assignment,
  Campaign,
  CannedResponse,
  InteractionStep,
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
import { schema as userSchema, resolvers as userResolvers, buildUserOrganizationQuery } from './user'
import {
  schema as conversationSchema,
  getConversations,
  resolvers as conversationsResolver
} from './conversations'
import { schema as organizationSchema, resolvers as organizationResolvers } from './organization'
import { schema as campaignSchema, resolvers as campaignResolvers } from './campaign'
import {
  schema as assignmentSchema,
  resolvers as assignmentResolvers
} from './assignment'
import {
  schema as interactionStepSchema,
  resolvers as interactionStepResolvers
} from './interaction-step'
import { schema as questionSchema, resolvers as questionResolvers } from './question'
import {
  schema as questionResponseSchema,
  resolvers as questionResponseResolvers
} from './question-response'
import { GraphQLPhone } from './phone'
import { schema as optOutSchema, resolvers as optOutResolvers } from './opt-out'
import { schema as messageSchema, resolvers as messageResolvers } from './message'
import {
  schema as campaignContactSchema,
  resolvers as campaignContactResolvers
} from './campaign-contact'
import {
  schema as cannedResponseSchema,
  resolvers as cannedResponseResolvers
} from './canned-response'
import { schema as inviteSchema, resolvers as inviteResolvers } from './invite'
import {
  authRequired,
  accessRequired,
  hasRole,
  assignmentRequired,
  superAdminRequired
} from './errors'
import serviceMap from './lib/services'
import { saveNewIncomingMessage } from './lib/message-sending'
import { gzip, log, makeTree } from '../../lib'
// import { isBetweenTextingHours } from '../../lib/timezones'
import { Notifications, sendUserNotification } from '../notifications'
import {
  uploadContacts,
  loadContactsFromDataWarehouse,
  assignTexters,
  exportCampaign
} from '../../workers/jobs'
const uuidv4 = require('uuid').v4
import GraphQLDate from 'graphql-date'
import GraphQLJSON from 'graphql-type-json'
import { GraphQLError } from 'graphql/error'

const JOBS_SAME_PROCESS = !!(process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS)
const JOBS_SYNC = !!(process.env.JOBS_SYNC || global.JOBS_SYNC)

async function editCampaign(id, campaign, loaders, user, origCampaignRecord) {
  const {
    title,
    description,
    dueBy,
    useDynamicAssignment,
    logoImageUrl,
    introHtml,
    primaryColor
  } = campaign
  // some changes require ADMIN and we recheck below
  const organizationId = campaign.organizationId || origCampaignRecord.organization_id
  await accessRequired(user, organizationId, 'SUPERVOLUNTEER', /* superadmin*/ true)
  const campaignUpdates = {
    id,
    title,
    description,
    due_by: dueBy,
    organization_id: organizationId,
    use_dynamic_assignment: useDynamicAssignment,
    logo_image_url: isUrl(logoImageUrl) ? logoImageUrl : '',
    primary_color: primaryColor,
    intro_html: introHtml
  }

  Object.keys(campaignUpdates).forEach(key => {
    if (typeof campaignUpdates[key] === 'undefined') {
      delete campaignUpdates[key]
    }
  })

  if (campaign.hasOwnProperty('contacts') && campaign.contacts) {
    await accessRequired(user, organizationId, 'ADMIN', /* superadmin*/ true)
    const contactsToSave = campaign.contacts.map(datum => {
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
      uploadContacts(job)
    }
  }
  if (campaign.hasOwnProperty('contactSql') && datawarehouse && user.is_superadmin) {
    await accessRequired(user, organizationId, 'ADMIN', /* superadmin*/ true)
    let job = await JobRequest.save({
      queue_name: `${id}:edit_campaign`,
      job_type: 'upload_contacts_sql',
      locks_queue: true,
      assigned: JOBS_SAME_PROCESS, // can get called immediately, below
      campaign_id: id,
      payload: campaign.contactSql
    })
    if (JOBS_SAME_PROCESS) {
      loadContactsFromDataWarehouse(job)
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
      if (JOBS_SYNC) {
        await assignTexters(job)
      } else {
        assignTexters(job)
      }
    }

    // assign the maxContacts
    campaign.texters.forEach(async texter => {
      const dog = r
        .knex('campaign')
        .where({ id })
        .select('useDynamicAssignment')
      await r
        .knex('assignment')
        .where({ user_id: texter.id, campaign_id: id })
        .update({ max_contacts: texter.maxContacts ? texter.maxContacts : null })
    })
  }

  if (campaign.hasOwnProperty('interactionSteps')) {
    await accessRequired(user, organizationId, 'ADMIN', /* superadmin*/ true)
    await updateInteractionSteps(id, [campaign.interactionSteps], origCampaignRecord)
  }

  if (campaign.hasOwnProperty('cannedResponses')) {
    const cannedResponses = campaign.cannedResponses
    const convertedResponses = []
    for (let index = 0; index < cannedResponses.length; index++) {
      const response = cannedResponses[index]
      const newId = await Math.floor(Math.random() * 10000000)
      convertedResponses.push({
        ...response,
        campaign_id: id,
        id: newId
      })
    }

    await r
      .table('canned_response')
      .getAll(id, { index: 'campaign_id' })
      .filter({ user_id: '' })
      .delete()
    await CannedResponse.save(convertedResponses)
  }

  const newCampaign = await Campaign.get(id).update(campaignUpdates)
  return newCampaign || loaders.campaign.load(id)
}

async function updateInteractionSteps(
  campaignId,
  interactionSteps,
  origCampaignRecord,
  idMap = {}
) {
  await interactionSteps.forEach(async is => {
    // map the interaction step ids for new ones
    if (idMap[is.parentInteractionId]) {
      is.parentInteractionId = idMap[is.parentInteractionId]
    }
    if (is.id.indexOf('new') !== -1) {
      const newIstep = await InteractionStep.save({
          parent_interaction_id: is.parentInteractionId || null,
          question: is.questionText,
          script: is.script,
          answer_option: is.answerOption,
          answer_actions: is.answerActions,
          campaign_id: campaignId,
          is_deleted: false
        })
      idMap[is.id] = newIstep.id
    } else {
      if (!origCampaignRecord.is_started && is.isDeleted) {
        await r
          .knex('interaction_step')
          .where({ id: is.id })
          .delete()
      } else {
        await r
          .knex('interaction_step')
          .where({ id: is.id })
          .update({
            question: is.questionText,
            script: is.script,
            answer_option: is.answerOption,
            answer_actions: is.answerActions,
            is_deleted: is.isDeleted
          })
      }
    }
    await updateInteractionSteps(campaignId, is.interactionSteps, origCampaignRecord, idMap)
  })
}

const rootMutations = {
  RootMutation: {
    userAgreeTerms: async (_, { userId }, { user, loaders }) => {
      const currentUser = await r
        .table('user')
        .get(userId)
        .update({
          terms: true
        })
      return currentUser
    },

    sendReply: async (_, { id, message }, { user, loaders }) => {
      const contact = await loaders.campaignContact.load(id)
      const campaign = await loaders.campaign.load(contact.campaign_id)

      await accessRequired(user, campaign.organization_id, 'ADMIN')

      const lastMessage = await r
        .table('message')
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
      const mockId = `mocked_${Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, '')}`
      await saveNewIncomingMessage(
        new Message({
          contact_number: contactNumber,
          user_number: userNumber,
          is_from_contact: true,
          text: message,
          service_response: JSON.stringify({
            fakeMessage: true,
            userId: user.id,
            userFirstName: user.first_name
          }),
          service_id: mockId,
          assignment_id: lastMessage.assignment_id,
          service: lastMessage.service,
          send_status: 'DELIVERED'
        })
      )
      return loaders.campaignContact.load(id)
    },
    exportCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
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
        exportCampaign(newJob)
      }
      return newJob
    },
    editOrganizationRoles: async (_, { userId, organizationId, roles }, { user, loaders }) => {
      const currentRoles = (await r
        .knex('user_organization')
        .where({
          organization_id: organizationId,
          user_id: userId
        })
        .select('role')).map(res => res.role)
      const oldRoleIsOwner = currentRoles.indexOf('OWNER') !== -1
      const newRoleIsOwner = roles.indexOf('OWNER') !== -1
      const roleRequired = oldRoleIsOwner || newRoleIsOwner ? 'OWNER' : 'ADMIN'
      let newOrgRoles = []

      await accessRequired(user, organizationId, roleRequired)

      currentRoles.forEach(async curRole => {
        if (roles.indexOf(curRole) === -1) {
          await r
            .table('user_organization')
            .getAll([organizationId, userId], { index: 'organization_user' })
            .filter({ role: curRole })
            .delete()
        }
      })

      newOrgRoles = roles.filter(newRole => currentRoles.indexOf(newRole) === -1).map(newRole => ({
        organization_id: organizationId,
        user_id: userId,
        role: newRole
      }))

      if (newOrgRoles.length) {
        await UserOrganization.save(newOrgRoles, { conflict: 'update' })
      }
      return loaders.organization.load(organizationId)
    },
    editUser: async (_, { organizationId, userId, userData }, { user }) => {
      if (user.id !== userId) {
        // User can edit themselves
        await accessRequired(user, organizationId, 'ADMIN', true)
      }
      const userRes = await r
        .knex('user')
        .rightJoin('user_organization', 'user.id', 'user_organization.user_id')
        .where({
          'user_organization.organization_id': organizationId,
          'user.id': userId
        })
        .limit(1)
      if (!userRes || !userRes.length) {
        return null
      } else {
        const member = userRes[0]
        if (userData) {
          const userRes = await r
            .knex('user')
            .where('id', userId)
            .update({
              first_name: userData.firstName,
              last_name: userData.lastName,
              email: userData.email,
              cell: userData.cell
            })
          userData = {
            id: userId,
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            cell: userData.cell
          }
        } else {
          userData = member
        }
        return userData
      }
    },
    joinOrganization: async (_, { organizationUuid }, { user, loaders }) => {
      let organization
      ;[organization] = await r.knex('organization').where('uuid', organizationUuid)
      if (organization) {
        const userOrg = await r
          .table('user_organization')
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
    assignUserToCampaign: async (_, { organizationUuid, campaignId }, { user, loaders }) => {
      const campaign = await r
        .knex('campaign')
        .leftJoin('organization', 'campaign.organization_id', 'organization.id')
        .where({
          'campaign.id': campaignId,
          'campaign.use_dynamic_assignment': true,
          'organization.uuid': organizationUuid
        })
        .select('campaign.*')
        .first()
      if (!campaign) {
        throw new GraphQLError({
          status: 403,
          message: 'Invalid join request'
        })
      }
      const assignment = await r
        .table('assignment')
        .getAll(user.id, { index: 'user_id' })
        .filter({ campaign_id: campaign.id })
        .limit(1)(0)
        .default(null)
      if (!assignment) {
        await Assignment.save({
          user_id: user.id,
          campaign_id: campaign.id,
          max_contacts: parseInt(process.env.MAX_CONTACTS_PER_TEXTER || 0, 10)
        })
      }
      return campaign
    },
    updateTextingHours: async (
      _,
      { organizationId, textingHoursStart, textingHoursEnd },
      { user }
    ) => {
      await accessRequired(user, organizationId, 'OWNER')

      await Organization.get(organizationId).update({
        texting_hours_start: textingHoursStart,
        texting_hours_end: textingHoursEnd
      })

      return await Organization.get(organizationId)
    },
    updateTextingHoursEnforcement: async (
      _,
      { organizationId, textingHoursEnforced },
      { user }
    ) => {
      await accessRequired(user, organizationId, 'SUPERVOLUNTEER')

      await Organization.get(organizationId).update({
        texting_hours_enforced: textingHoursEnforced
      })

      return await Organization.get(organizationId)
    },
    createInvite: async (_, { user }) => {
      if ((user && user.is_superadmin) || !process.env.SUPPRESS_SELF_INVITE) {
        const inviteInstance = new Invite({
          is_valid: true,
          hash: uuidv4()
        })
        const newInvite = await inviteInstance.save()
        return newInvite
      }
    },
    createCampaign: async (_, { campaign }, { user, loaders }) => {
      await accessRequired(user, campaign.organizationId, 'ADMIN', /* allowSuperadmin=*/ true)
      const campaignInstance = new Campaign({
        organization_id: campaign.organizationId,
        title: campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false
      })
      const newCampaign = await campaignInstance.save()
      return editCampaign(newCampaign.id, campaign, loaders, user)
    },
    copyCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'ADMIN')

      const campaignInstance = new Campaign({
        organization_id: campaign.organization_id,
        title: 'COPY - ' + campaign.title,
        description: campaign.description,
        due_by: campaign.dueBy,
        is_started: false,
        is_archived: false
      })
      const newCampaign = await campaignInstance.save()
      const newCampaignId = newCampaign.id
      const oldCampaignId = campaign.id

      let interactions = await r.knex('interaction_step').where({ campaign_id: oldCampaignId })

      const interactionsArr = []
      interactions.forEach((interaction, index) => {
        if (interaction.parent_interaction_id) {
          let is = {
            id: 'new' + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: 'new' + interaction.parent_interaction_id
          }
          interactionsArr.push(is)
        } else if (!interaction.parent_interaction_id) {
          let is = {
            id: 'new' + interaction.id,
            questionText: interaction.question,
            script: interaction.script,
            answerOption: interaction.answer_option,
            answerActions: interaction.answer_actions,
            isDeleted: interaction.is_deleted,
            campaign_id: newCampaignId,
            parentInteractionId: interaction.parent_interaction_id
          }
          interactionsArr.push(is)
        }
      })

      let createSteps = updateInteractionSteps(
        newCampaignId,
        [makeTree(interactionsArr, (id = null))],
        campaign,
        {}
      )

      await createSteps

      let createCannedResponses = r
        .knex('canned_response')
        .where({ campaign_id: oldCampaignId })
        .then(function (res) {
          res.forEach((response, index) => {
            const copiedCannedResponse = new CannedResponse({
              campaign_id: newCampaignId,
              title: response.title,
              text: response.text
            }).save()
          })
        })

      await createCannedResponses

      return newCampaign
    },
    unarchiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'ADMIN')
      campaign.is_archived = false
      await campaign.save()
      return campaign
    },
    archiveCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'ADMIN')
      campaign.is_archived = true
      await campaign.save()
      return campaign
    },
    startCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'ADMIN')
      campaign.is_started = true
      await campaign.save()
      await sendUserNotification({
        type: Notifications.CAMPAIGN_STARTED,
        campaignId: id
      })
      return campaign
    },
    editCampaign: async (_, { id, campaign }, { user, loaders }) => {
      const origCampaign = await Campaign.get(id)
      if (campaign.organizationId) {
        await accessRequired(user, campaign.organizationId, 'ADMIN')
      } else {
        await accessRequired(user, origCampaign.organization_id, 'SUPERVOLUNTEER')
      }
      if (origCampaign.is_started && campaign.hasOwnProperty('contacts') && campaign.contacts) {
        throw new GraphQLError({
          status: 400,
          message: 'Not allowed to add contacts after the campaign starts'
        })
      }
      return editCampaign(id, campaign, loaders, user, origCampaign)
    },
    createCannedResponse: async (_, { cannedResponse }, { user, loaders }) => {
      authRequired(user)

      const cannedResponseInstance = new CannedResponse({
        campaign_id: cannedResponse.campaignId,
        user_id: cannedResponse.userId,
        title: cannedResponse.title,
        text: cannedResponse.text
      }).save()
      // deletes duplicate created canned_responses
      let query = r
        .knex('canned_response')
        .where(
          'text',
          'in',
          r
            .knex('canned_response')
            .where({
              text: cannedResponse.text,
              campaign_id: cannedResponse.campaignId
            })
            .select('text')
        )
        .andWhere({ user_id: cannedResponse.userId })
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
        name,
        uuid: uuidv4()
      })
      await UserOrganization.save(
        ['OWNER', 'ADMIN', 'TEXTER'].map(role => ({
          user_id: userId,
          organization_id: newOrganization.id,
          role
        }))
      )
      await Invite.save(
        {
          id: inviteId,
          is_valid: false
        },
        { conflict: 'update' }
      )

      return newOrganization
    },
    editCampaignContactMessageStatus: async (
      _,
      { messageStatus, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)
      contact.message_status = messageStatus
      return await contact.save()
    },
    getAssignmentContacts: async (_, { assignmentId, contactIds, findNew }, { loaders, user }) => {
      assignmentRequired(user, assignmentId)
      const contacts = contactIds.map(async (contactId) => {
        const contact = await loaders.campaignContact.load(contactId)
        if (contact && contact.assignment_id === Number(assignmentId)) {
          return contact
        }
        return null
      })
      if (findNew) {
        // maybe TODO: we could automatically add dynamic assignments in the same api call
        // findNewCampaignContact()
      }
      return contacts
    },
    findNewCampaignContact: async (_, { assignmentId, numberContacts }, { loaders, user }) => {
      /* This attempts to find a new contact for the assignment, in the case that useDynamicAssigment == true */
      const assignment = await Assignment.get(assignmentId)
      if (assignment.user_id != user.id) {
        throw new GraphQLError({
          status: 400,
          message: 'Invalid assignment'
        })
      }
      const campaign = await Campaign.get(assignment.campaign_id)
      if (!campaign.use_dynamic_assignment) {
        return { found: false }
      }

      const contactsCount = await r.getCount(
        r.knex('campaign_contact').where('assignment_id', assignmentId)
      )

      numberContacts = numberContacts || 1
      if (assignment.max_contacts && contactsCount + numberContacts > assignment.max_contacts) {
        numberContacts = assignment.max_contacts - contactsCount
      }
      // Don't add more if they already have that many
      const result = await r.getCount(
        r.knex('campaign_contact').where({
          assignment_id: assignmentId,
          message_status: 'needsMessage',
          is_opted_out: false
        })
      )
      if (result >= numberContacts) {
        return { found: false }
      }

      const updatedCount = await r
        .knex('campaign_contact')
        .where(
          'id',
          'in',
          r
            .knex('campaign_contact')
            .where({
              assignment_id: null,
              campaign_id: campaign.id
            })
            .limit(numberContacts)
            .select('id')
        )
        .update({ assignment_id: assignmentId })
        .catch(log.error)

      if (updatedCount > 0) {
        return { found: true }
      } else {
        return { found: false }
      }
    },

    createOptOut: async (_, { optOut, campaignContactId }, { loaders, user }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)

      const { assignmentId, cell, reason } = optOut

      const campaign = await r
        .table('assignment')
        .get(assignmentId)
        .eqJoin('campaign_id', r.table('campaign'))('right')
      await new OptOut({
        assignment_id: assignmentId,
        organization_id: campaign.organization_id,
        reason_code: reason,
        cell
      }).save()

      // update all organization's active campaigns as well
      await r
        .knex('campaign_contact')
        .where(
          'id',
          'in',
          r
            .knex('campaign_contact')
            .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
            .where({
              'campaign_contact.cell': cell,
              'campaign.organization_id': campaign.organization_id,
              'campaign.is_archived': false
            })
            .select('campaign_contact.id')
        )
        .update({
          is_opted_out: true
        })

      return loaders.campaignContact.load(campaignContactId)
    },
    bulkSendMessages: async (_, { assignmentId }, loaders) => {
      if (!process.env.ALLOW_SEND_ALL || !process.env.NOT_IN_USA) {
        log.error('Not allowed to send all messages at once')
        throw new GraphQLError({
          status: 403,
          message: 'Not allowed to send all messages at once'
        })
      }

      const assignment = await Assignment.get(assignmentId)
      const campaign = await Campaign.get(assignment.campaign_id)
      // Assign some contacts
      await rootMutations.RootMutation.findNewCampaignContact(
        _,
        { assignmentId, numberContacts: Number(process.env.BULK_SEND_CHUNK_SIZE) - 1 },
        loaders
      )

      const contacts = await r
        .knex('campaign_contact')
        .where({ message_status: 'needsMessage' })
        .where({ assignment_id: assignmentId })
        .orderByRaw('updated_at')
        .limit(process.env.BULK_SEND_CHUNK_SIZE)

      const texter = camelCaseKeys(await User.get(assignment.user_id))
      const customFields = Object.keys(JSON.parse(contacts[0].custom_fields))

      const contactMessages = await contacts.map(async contact => {
        const script = await campaignContactResolvers.CampaignContact.currentInteractionStepScript(
          contact
        )
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
        await rootMutations.RootMutation.sendMessage(
          _,
          { message: contactMessage, campaignContactId: contact.id },
          loaders
        )
      })

      return []
    },
    sendMessage: async (_, { message, campaignContactId }, { user, loaders }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      const campaign = await loaders.campaign.load(contact.campaign_id)
      if (contact.assignment_id !== parseInt(message.assignmentId) || campaign.is_archived) {
        throw new GraphQLError({
          status: 400,
          message: 'Your assignment has changed'
        })
      }
      const organization = await r
        .table('campaign')
        .get(contact.campaign_id)
        .eqJoin('organization_id', r.table('organization'))('right')

      const orgFeatures = JSON.parse(organization.features || '{}')

      const optOut = await r
        .table('opt_out')
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

      if (text.length > (process.env.MAX_MESSAGE_LENGTH || 99999)) {
        throw new GraphQLError({
          status: 400,
          message: 'Message was longer than the limit'
        })
      }

      const replaceCurlyApostrophes = rawText => rawText.replace(/[\u2018\u2019]/g, "'")

      const messageInstance = new Message({
        text: replaceCurlyApostrophes(text),
        contact_number: contactNumber,
        user_id: user.id,
        user_number: '',
        assignment_id: message.assignmentId,
        send_status: JOBS_SAME_PROCESS ? 'SENDING' : 'QUEUED',
        service: orgFeatures.service || process.env.DEFAULT_SERVICE || '',
        is_from_contact: false,
        queued_at: new Date()
      })

      await messageInstance.save()

      if (contact.message_status === 'needsResponse') {
        const service = serviceMap[messageInstance.service || process.env.DEFAULT_SERVICE]
        contact.message_status = 'convo'
        contact.updated_at = 'now()'
        await contact.save()

        service.sendMessage(messageInstance)
        return contact
      } else {
        const service = serviceMap[messageInstance.service || process.env.DEFAULT_SERVICE]
        contact.message_status = 'messaged'
        contact.updated_at = 'now()'
        await contact.save()

        service.sendMessage(messageInstance)
        return contact
      }

      if (JOBS_SAME_PROCESS) {
        const service = serviceMap[messageInstance.service || process.env.DEFAULT_SERVICE]
        log.info(
          `Sending (${service}): ${messageInstance.user_number} -> ${
            messageInstance.contact_number
          }\nMessage: ${messageInstance.text}`
        )
        service.sendMessage(messageInstance)
      }

      return contact
    },
    deleteQuestionResponses: async (
      _,
      { interactionStepIds, campaignContactId },
      { loaders, user }
    ) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      await assignmentRequired(user, contact.assignment_id)
      // TODO: maybe undo action_handler
      await r
        .table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .getAll(...interactionStepIds, { index: 'interaction_step_id' })
        .delete()
      return contact
    },
    updateQuestionResponses: async (_, { questionResponses, campaignContactId }, { loaders }) => {
      const count = questionResponses.length

      for (let i = 0; i < count; i++) {
        const questionResponse = questionResponses[i]
        const { interactionStepId, value } = questionResponse
        await r
          .table('question_response')
          .getAll(campaignContactId, { index: 'campaign_contact_id' })
          .filter({ interaction_step_id: interactionStepId })
          .delete()

        // TODO: maybe undo action_handler if updated answer

        const qr = await new QuestionResponse({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStepId,
          value
        }).save()
        const interactionStepResult = await r
          .knex('interaction_step')
          // TODO: is this really parent_interaction_id or just interaction_id?
          .where({
            parent_interaction_id: interactionStepId,
            answer_option: value
          })
          .whereNot('answer_actions', '')
          .whereNotNull('answer_actions')

        const interactionStepAction =
          interactionStepResult.length && interactionStepResult[0].answer_actions
        if (interactionStepAction) {
          // run interaction step handler
          try {
            const handler = require(`../action_handlers/${interactionStepAction}.js`)
            handler.processAction(qr, interactionStepResult[0], campaignContactId)
          } catch (err) {
            console.error(
              'Handler for InteractionStep',
              interactionStepId,
              'Does Not Exist:',
              interactionStepAction
            )
          }
        }
      }

      const contact = loaders.campaignContact.load(campaignContactId)
      return contact
    },
    reassignCampaignContacts: async (
      _,
      { organizationId, campaignIdsContactIds, newTexterUserId },
      { user }
    ) => {
      // verify permissions
      await accessRequired(user, organizationId, 'ADMIN', /* superadmin*/ true)

      // group contactIds by campaign
      // group messages by campaign
      const campaignIdContactIdsMap = new Map()
      const campaignIdMessagesIdsMap = new Map()
      for (const campaignIdContactId of campaignIdsContactIds) {
        const { campaignId, campaignContactId, messageIds } = campaignIdContactId

        if (!campaignIdContactIdsMap.has(campaignId)) {
          campaignIdContactIdsMap.set(campaignId, [])
        }

        campaignIdContactIdsMap.get(campaignId).push(campaignContactId)

        if (!campaignIdMessagesIdsMap.has(campaignId)) {
          campaignIdMessagesIdsMap.set(campaignId, [])
        }

        campaignIdMessagesIdsMap.get(campaignId).push(...messageIds)
      }

      // ensure existence of assignments
      const campaignIdAssignmentIdMap = new Map()
      for (const [campaignId, _] of campaignIdContactIdsMap) {
        let assignment = await r
          .table('assignment')
          .getAll(newTexterUserId, { index: 'user_id' })
          .filter({ campaign_id: campaignId })
          .limit(1)(0)
          .default(null)
        if (!assignment) {
          assignment = await Assignment.save({
            user_id: newTexterUserId,
            campaign_id: campaignId,
            max_contacts: parseInt(process.env.MAX_CONTACTS_PER_TEXTER || 0, 10)
          })
        }
        campaignIdAssignmentIdMap.set(campaignId, assignment.id)
      }

      // do the reassignment
      const returnCampaignIdAssignmentIds = []

      // TODO(larry) do this in a transaction!
      try {
        for (const [campaignId, campaignContactIds] of campaignIdContactIdsMap) {
          const assignmentId = campaignIdAssignmentIdMap.get(campaignId)

          await r
            .knex('campaign_contact')
            .where('campaign_id', campaignId)
            .whereIn('id', campaignContactIds)
            .update({
              assignment_id: assignmentId
            })

          returnCampaignIdAssignmentIds.push({
            campaignId,
            assignmentId: assignmentId.toString()
          })
        }
        for (const [campaignId, messageIds] of campaignIdMessagesIdsMap) {
          const assignmentId = campaignIdAssignmentIdMap.get(campaignId)

          await r
            .knex('message')
            .whereIn(
              'id',
              messageIds.map(messageId => {
                return messageId
              })
            )
            .update({
              assignment_id: assignmentId
            })
        }
      } catch (error) {
        log.error(error)
      }

      return returnCampaignIdAssignmentIds
    }
  }
}

const rootResolvers = {
  Action: {
    name: o => o.name,
    display_name: o => o.display_name,
    instructions: o => o.instructions
  },
  FoundContact: {
    found: o => o.found
  },
  RootQuery: {
    campaign: async (_, { id }, { loaders, user }) => {
      const campaign = await loaders.campaign.load(id)
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER')
      return campaign
    },
    assignment: async (_, { id }, { loaders, user }) => {
      authRequired(user)
      const assignment = await loaders.assignment.load(id)
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      if (assignment.user_id == user.id) {
        await accessRequired(user, campaign.organization_id, 'TEXTER', /* allowSuperadmin=*/ true)
      } else {
        await accessRequired(
          user,
          campaign.organization_id,
          'SUPERVOLUNTEER',
          /* allowSuperadmin=*/ true
        )
      }
      return assignment
    },
    organization: async (_, { id }, { loaders }) => loaders.organization.load(id),
    inviteByHash: async (_, { hash }, { loaders, user }) => {
      authRequired(user)
      return r.table('invite').filter({ hash })
    },
    currentUser: async (_, { id }, { user }) => {
      if (!user) {
        return null
      }
      else {
        return user
      }
    },
    contact: async (_, { id }, { loaders, user }) => {
      authRequired(user)
      const contact = await loaders.campaignContact.load(id)
      const campaign = await loaders.campaign.load(contact.campaign_id)
      await accessRequired(user, campaign.organization_id, 'TEXTER', /* allowSuperadmin=*/ true)
      return contact
    },
    organizations: async (_, { id }, { user }) => {
      await superAdminRequired(user)
      return r.table('organization')
    },
    availableActions: (_, { organizationId }, { user }) => {
      if (!process.env.ACTION_HANDLERS) {
        return []
      }
      const allHandlers = process.env.ACTION_HANDLERS.split(',')

      const availableHandlers = allHandlers
        .map(handler => {
          return {
            name: handler,
            handler: require(`../action_handlers/${handler}.js`)
          }
        })
        .filter(async h => h && (await h.handler.available(organizationId)))

      const availableHandlerObjects = availableHandlers.map(handler => {
        return {
          name: handler.name,
          display_name: handler.handler.displayName(),
          instructions: handler.handler.instructions()
        }
      })
      return availableHandlerObjects
    },
    conversations: async (
      _,
      { cursor, organizationId, campaignsFilter, assignmentsFilter, contactsFilter, utc },
      { user }
    ) => {
      await accessRequired(user, organizationId, 'SUPERVOLUNTEER', true)

      return getConversations(
        cursor,
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        contactsFilter,
        utc
      )
    }
  }
}

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
  ...{ Date: GraphQLDate },
  ...{ JSON: GraphQLJSON },
  ...{ Phone: GraphQLPhone },
  ...questionResolvers,
  ...conversationsResolver,
  ...rootMutations
}
