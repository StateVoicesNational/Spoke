import { Campaign,
  Assignment,
  BalanceLineItem,
  CampaignContact,
  CannedResponse,
  Invite,
  Message,
  OptOut,
  Organization,
  QuestionResponse,
  UserOrganization,
  UserCell,
  InteractionStep,
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
  schema as planSchema,
  resolvers as planResolvers
} from './plan'
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
  schema as balanceLineItemSchema,
  resolvers as balanceLineItemResolvers
} from './balance-line-item'

import {
  GraphQLError,
  authRequired,
  accessRequired,
  superAdminRequired
} from './errors'
import { rentNewCell, sendMessage, handleIncomingMessage } from './lib/nexmo'
import { getFormattedPhoneNumber } from '../../lib/phone-format'
import { isBetweenTextingHours } from '../../lib/timezones'
import { Notifications, sendUserNotification } from '../notifications'
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


  type RootQuery {
    currentUser: User
    organization(id:String!): Organization
    campaign(id:String!): Campaign
    invite(id:String!): Invite
    contact(id:String!): CampaignContact,
    assignment(id:String!): Assignment,
    stripePublishableKey: String,
    organizations: [Organization]
  }

  type RootMutation {
    createCampaign(campaign:CampaignInput!): Campaign
    editCampaign(id:String!, campaign:CampaignInput!): Campaign
    exportCampaign(id:String!): Campaign
    createCannedResponse(cannedResponse:CannedResponseInput!): CannedResponse
    createOrganization(name: String!, userId: String!, inviteId: String!): Organization
    joinOrganization(organizationId: String!): Organization
    editOrganizationRoles(organizationId: String!, userId: String!, roles: [String]): Organization
    updateCard( organizationId: String!, stripeToken: String!): Organization
    addAccountCredit( organizationId: String!, balanceAmount: Int!): Organization
    updateTextingHours( organizationId: String!, textingHoursStart: Int!, textingHoursEnd: Int!): Organization
    updateTextingHoursEnforcement( organizationId: String!, textingHoursEnforced: Boolean!): Organization
    addManualAccountCredit( organizationId: String!, balanceAmount: Int!, paymentMethod: String!): Organization
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

const PER_ASSIGNED_NUMBER_MESSAGE_COUNT = 300

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
    const contactsToSave = []

    const count = campaign.contacts.length

    for (let i = 0; i < count; i++) {
      const datum = campaign.contacts[i]
      const modelData = {
        campaign_id: datum.campaignId,
        first_name: datum.firstName,
        last_name: datum.lastName,
        cell: datum.cell,
        custom_fields: datum.customFields,
        zip: datum.zip
      }
      modelData.campaign_id = id
      modelData.custom_fields = JSON.parse(modelData.custom_fields)

      if (datum.zip) {
        const zipDatum = await r.table('zip_code').get(datum.zip)
        if (zipDatum) {
          modelData.timezone_offset = `${zipDatum.timezone_offset}_${zipDatum.has_dst}`
        }
      }
      contactsToSave.push(modelData)

    }
    await r.table('campaign_contact')
      .getAll(id, { index: 'campaign_id' })
      .delete()
    await CampaignContact.save(contactsToSave)
  }

  if (campaign.hasOwnProperty('texters')) {
    const currentAssignments = await r.table('assignment')
      .getAll(id, { index: 'campaign_id' })
      .merge((row) => ({
        needsMessageCount: r.table('campaign_contact')
          .getAll(row('id'), { index: 'assignment_id' })
          .filter({ message_status: 'needsMessage' })
          .count()
      }))

    const unchangedTexters = {}
    const changedAssignments = currentAssignments.map((assignment) => {
      const texter = campaign.texters.filter((ele) => ele.id === assignment.user_id)[0]
      if (!texter) {
        return assignment
      } else if (texter.needsMessageCount !== assignment.needsMessageCount) {
        return assignment
      }
      unchangedTexters[assignment.user_id] = true
      return null
    })
    .filter((ele) => ele !== null)

    // This atomically updates all the assignments to guard against people sending messages while all this is going on
    const changedAssignmentIds = changedAssignments.map((ele) => ele.id)
    await r.table('campaign_contact')
      .getAll(...changedAssignmentIds, { index: 'assignment_id' })
      .filter({ message_status: 'needsMessage' })
      .update({
        assignment_id: r.branch(r.row('message_status').eq('needsMessage'), '', r.row('assignment_id'))
      })

    let availableContacts = await r.table('campaign_contact')
      .getAll([id, ''], { index: 'campaign_assignment' })
      .count()

    // Go through all the submitted texters and create assignments
    const texterCount = campaign.texters.length
    for (let index = 0; index < texterCount; index++) {
      const texter = campaign.texters[index]
      if (unchangedTexters[texter.id]) {
        continue
      }
      const contactsToAssign = availableContacts > texter.needsMessageCount ? texter.needsMessageCount : availableContacts
      availableContacts = availableContacts - contactsToAssign
      const existingAssignment = changedAssignments.find((ele) => ele.user_id === texter.id)
      let assignment = null
      if (existingAssignment) {
        assignment = existingAssignment
      } else {
        assignment = await new Assignment({
          user_id: texter.id,
          campaign_id: id
        }).save()
      }

      await r.table('campaign_contact')
        .getAll([id, ''], { index: 'campaign_assignment' })
        .limit(contactsToAssign)
        .update({ assignment_id: assignment.id })

      if (existingAssignment) {
        // We can't rely on an observer because nothing
        // about the actual assignment object changes
        await sendUserNotification({
          type: Notifications.ASSIGNMENT_UPDATED,
          assignment
         })
      }
    }
    let assignmentsToDelete = await r.table('assignment')
      .getAll(id, { index: 'campaign_id' })
      .merge((row) => ({
        count: r.table('campaign_contact')
          .getAll(row('id'), { index: 'assignment_id' })
          .count()
      }))
      .filter((row) => row('count').eq(0))
    await r.table('assignment')
      .getAll(...assignmentsToDelete.map((ele) => ele.id))
      .delete()
  }

  if (campaign.hasOwnProperty('interactionSteps')) {
    const interactionSteps = []
    for (let index = 0; index < campaign.interactionSteps.length; index++) {
      // We use r.uuid(step.id) so that
      // any new steps will get a proper
      // UUID as well.
      const step = campaign.interactionSteps[index]
      const newId = await r.uuid(step.id)
      const answerOptions = []
      if (step.answerOptions) {
        for (let innerIndex = 0; innerIndex < step.answerOptions.length; innerIndex++) {
          const option = step.answerOptions[innerIndex]
          let nextStepId = ''
          if (option.nextInteractionStepId) {
            nextStepId = await r.uuid(option.nextInteractionStepId)
          }
          answerOptions.push({
            interaction_step_id: nextStepId,
            value: option.value
          })
        }
      }
      interactionSteps.push({
        id: newId,
        campaign_id: id,
        question: step.question,
        script: step.script,
        answer_options: answerOptions
      })
    }

    await r.table('interaction_step')
      .getAll(id, { index: 'campaign_id' })
      .delete()
    await InteractionStep
      .save(interactionSteps)
  }

  if (campaign.hasOwnProperty('cannedResponses')) {
    const cannedResponses = campaign.cannedResponses
    const convertedResponses = []
    for (let index = 0; index < cannedResponses.length; index++) {
      const response = cannedResponses[index]
      const newId = await r.uuid(response.id)
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
    sendReply: async (_, { id, message }, { user, loaders }) => {
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
      await handleIncomingMessage({
        to: lastMessage.user_number,
        msisdn: contact.cell,
        text: message,
        messageId: `mocked_${ Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')}`
      })
      return loaders.campaignContact.load(id)
    },
    exportCampaign: async (_, { id }, { user, loaders }) => {
      const campaign = loaders.campaign.load(id)
      const organizationId = campaign.organization_id
      await accessRequired(user, organizationId, 'ADMIN')
      await JobRequest.save({
        payload: {
          id,
          requester: user.id
        },
        job_type: 'export'
      })
      return 1
    },
    editOrganizationRoles: async (_, { userId, organizationId, roles }, { user, loaders }) => {
      const userOrganization = await r.table('user_organization')
        .getAll(organizationId, { index: 'organization_id'})
        .filter({ user_id: userId })
        .limit(1)(0)

      const oldRoleIsOwner = userOrganization.roles.indexOf('OWNER') !== -1
      const newRoleIsOwner = roles.indexOf('OWNER') !== -1
      const roleRequired = (oldRoleIsOwner || newRoleIsOwner) ? 'OWNER' : 'ADMIN'
      await accessRequired(user, organizationId, roleRequired)

      userOrganization.roles = roles
      await UserOrganization.save(userOrganization, { conflict: 'update' })
      return loaders.organization.load(organizationId)
    },
    joinOrganization: async (_, { organizationId }, { user, loaders }) => {
      const userOrg = await r.table('user_organization')
        .getAll(user.id, { index: 'user_id' })
        .filter({ organization_id: organizationId })
        .limit(1)
        .nth(0)
        .default(null)

      if (!userOrg) {
        await UserOrganization.save({
          user_id: user.id,
          organization_id: organizationId,
          roles: ['TEXTER']
        })
      }
      return loaders.organization.load(organizationId)
    },
    updateTextingHours: async (_, { organizationId, textingHoursStart, textingHoursEnd }, { user }) => {
      await accessRequired(user, organizationId, 'OWNER')

      await Organization
        .get(organizationId)
        .update({
          texting_hours_settings: {
            permitted_hours: [textingHoursStart, textingHoursEnd]
          }
        })

      return await Organization.get(organizationId)
    },
    updateTextingHoursEnforcement: async (_, { organizationId, textingHoursEnforced }, { user }) => {
      await accessRequired(user, organizationId, 'OWNER')

      await Organization
        .get(organizationId)
        .update({
          texting_hours_settings: {
            is_enforced: textingHoursEnforced
          }
        })

      return await Organization.get(organizationId)
    },
    addManualAccountCredit: async(_, { organizationId, balanceAmount, paymentMethod }, { user, loaders }) => {
      await superAdminRequired(user)
      const organization = await loaders.organization.load(organizationId)
      const newBalanceAmount = organization.balance_amount + balanceAmount

      await new BalanceLineItem({
        organization_id: organizationId,
        currency: organization.currency,
        amount: balanceAmount,
        payment_method: paymentMethod,
        source: 'SUPERADMIN',
      }).save()

      return await Organization.get(organizationId).update({ balance_amount: newBalanceAmount })
    },
    addAccountCredit: async (_, { organizationId, balanceAmount }, { user, loaders }) => {
      await accessRequired(user, organizationId, 'OWNER')
      const organization = await loaders.organization.load(organizationId)
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      let charge = null
      try {
        charge = await stripe.charges.create({
          customer: organization.stripe_id,
          amount: balanceAmount,
          currency: organization.currency
        })
      } catch (e) {
        if (e.type === 'StripeCardError') {
          throw new GraphQLError({
            status: 400,
            message: e.message
          })
        }
      }
      const newBalanceAmount = organization.balance_amount + balanceAmount
      await new BalanceLineItem({
        organization_id: organizationId,
        currency: organization.currency,
        amount: balanceAmount,
        source: 'USER',
        payment_id: charge.id,
        payment_method: 'STRIPE',
      }).save()

      return await Organization.get(organizationId).update({ balance_amount: newBalanceAmount })
    },
    updateCard: async(_, { organizationId, stripeToken }, { user, loaders }) => {
      await accessRequired(user, organizationId, 'OWNER')
      const organization = await loaders.organization.load(organizationId)
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      try {
        if (organization.stripe_id) {
          await stripe.customers.update(organization.stripe_id, {
            source: stripeToken
          })
          return organization
        } else {
          const customer = await stripe.customers.create({
            description: organization.name,
            email: user.email,
            metadata: {
              organizationId
            },
            source: stripeToken
          })
          return await Organization
            .get(organizationId)
            .update({
              stripe_id: customer.id
            })
        }
      } catch (e) {
        if (e.type === 'StripeCardError') {
          throw new GraphQLError({
            status: 400,
            message: e.message
          })
        }
        throw e
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
      return editCampaign(id, campaign, loaders)
    },
    createCannedResponse: async (_, { cannedResponse }) => {
      const cannedResponseInstance = new CannedResponse({
        campaign_id: cannedResponse.campaignId,
        user_id: cannedResponse.userId,
        title: cannedResponse.title,
        text: cannedResponse.text
      })
      return cannedResponseInstance.save()
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
      const currency = 'usd'
      const plan = await r.table('plan')
        .filter({
          currency,
          is_default: true
        })
        .limit(1)(0)

      const newOrganization = await Organization.save({
        name,
        currency,
        plan_id: plan.id
      })
      await UserOrganization.save({
        user_id: userId,
        organization_id: newOrganization.id,
        roles: ['OWNER', 'ADMIN', 'TEXTER']
      })
      await Invite.save({
        id: inviteId,
        is_valid: false
      }, { conflict: 'update' })

      console.log("new organization", newOrganization)
      return newOrganization
    },
    editCampaignContactMessageStatus: async(_, { messageStatus, campaignContactId }, { loaders }) => {
      const contact = await loaders.campaignContact.load(campaignContactId)
      contact.message_status = messageStatus
      return await contact.save()
    },
    createOptOut: async(_, { optOut, campaignContactId }, { loaders }) => {
      const { assignmentId, cell } = optOut
      const campaign = await r.table('assignment')
        .get(assignmentId)
        .merge((doc) => ({
          campaign: r.table('campaign')
            .get(doc('campaign_id'))
        }))('campaign')
      await new OptOut({
        assignment_id: assignmentId,
        organization_id: campaign.organization_id,
        cell
      }).save()

      await r.table('campaign_contact')
        .getAll(cell, { index: 'cell' })
        .merge((contact) => ({
          organization_id: r.table('campaign')
            .get(contact('campaign_id'))
            ('organization_id')
        }))
        .filter({ organization_id: campaign.organization_id})
        .forEach((doc) => r.table('campaign_contact')
            .get(doc('id'))
            .update({ is_opted_out: true }))

      return loaders.campaignContact.load(campaignContactId)
    },
    sendMessage: async(_, { message, campaignContactId }, { loaders }) => {
      const texter = await loaders.user.load(message.userId)
      const contact = await loaders.campaignContact.load(campaignContactId)
      const campaign = await loaders.campaign.load(contact.campaign_id)

      if (contact.assignment_id !== message.assignmentId || campaign.is_archived) {
        throw new GraphQLError({
          status: 400,
          message: 'Your assignment has changed'
        })
      }

      const merged = await r.table('campaign')
        .get(contact.campaign_id)
        .merge((doc) => ({
          organization: r.table('organization').get(doc('organization_id'))
        }))
        .pluck('organization')
      const organization = merged.organization

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

      // const [textingHoursStart, textingHoursEnd] = organization.texting_hours_settings.permitted_hours
      // const config = {
      //   textingHoursEnforced: organization.texting_hours_settings.is_enforced,
      //   textingHoursStart,
      //   textingHoursEnd
      // }
      // const offsetData = zipData ? { offset: zipData.timezone_offset, hasDST: zipData.has_dst } : null
      // if (!isBetweenTextingHours(offsetData, config)) {
      //   throw new GraphQLError({
      //     status: 400,
      //     message: "Skipped sending because it's now outside texting hours for this contact"
      //   })
      // }

      const plan = await loaders.plan.load(organization.plan_id)
      const amountPerMessage = plan.amount_per_message

      if (organization.balance_amount < amountPerMessage) {
        throw new GraphQLError({
          status: 402,
          message: 'Not enough account credit to send message'
        })
      }

      let userNumber

      const lastMessage = await r.table('message')
        .getAll(contact.assignment_id, { index: 'assignment_id'})
        .filter({ contact_number: contact.cell })
        .limit(1)(0)
        .default(null)

      // always use already used cell in a thread with a user.
      if (lastMessage) {
        userNumber = lastMessage.user_number
      } else {
        // If the message thread already has a cell,
        let userCell = await r.table('user_cell')
          .getAll(texter.id, { index: 'user_id' })
          .filter({ is_primary: true })
          .limit(1)(0)
          .default(null)

        if (userCell) {
          const messageCount = await r.table('message')
            .getAll(userCell.cell, { index: 'user_number' })
            .count()
          if (messageCount >= PER_ASSIGNED_NUMBER_MESSAGE_COUNT) {
            await r.table('user_cell')
              .get(userCell.id)
              .update({ is_primary: false })
            userCell = null
          }
        }

        if (!userCell) {
          const newCell = await rentNewCell()

          userCell = new UserCell({
            cell: getFormattedPhoneNumber(newCell),
            user_id: texter.id,
            service: 'nexmo',
            is_primary: true
          })

          await userCell.save()
        }
        userNumber = userCell.cell
      }

      const { contactNumber, text } = message

      const replaceCurlyApostrophes = (rawText) => rawText
        .replace(/[\u2018\u2019]/g, "'")

      const messageInstance = new Message({
        text: replaceCurlyApostrophes(text),
        contact_number: contactNumber,
        user_number: userNumber,
        assignment_id: message.assignmentId,
        send_status: 'QUEUED',
        is_from_contact: false
      })

      const savedMessage = await messageInstance.save()

      organization.balance_amount = organization.balance_amount - amountPerMessage
      Organization.save(organization, { conflict: 'update' })
      await new BalanceLineItem({
        organization_id: organization.id,
        currency: organization.currency,
        amount: -amountPerMessage,
        message_id: savedMessage.id
      }).save()

      contact.message_status = 'messaged'
      await contact.save()

      return contact
    },
    deleteQuestionResponses: async(_, { interactionStepIds, campaignContactId }, { loaders }) => {
      await r.table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .filter((doc) => r.expr(interactionStepIds).contains(doc('interaction_step_id')))
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

        const newQuestionResponse = await new QuestionResponse({
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
    organization: async(_, { id }, { loaders, user }) => {
      // await accessRequired(user, id, 'ADMIN')
      return loaders.organization.load(id)
    },
    invite: async (_, { id }, { loaders, user }) => {
      authRequired(user)
      return loaders.invite.load(id)
    },
    currentUser: async(_, { id }, { user }) => user,
    contact: async(_, { id }, { loaders, user }) => {
      const contact = await loaders.campaignContact.load(id)
      // await accessRequired(user, contact.organization_id, 'TEXTER')
      return contact
    },
    stripePublishableKey: () => process.env.STRIPE_PUBLISHABLE_KEY,
    organizations: async(_, {}, { user }) => {
      await superAdminRequired(user)
      return r.table('organization')
    }
  }
}

export const schema = [
  rootSchema,
  userSchema,
  organizationSchema,
  planSchema,
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
  inviteSchema,
  balanceLineItemSchema
]

export const resolvers = {
  ...rootResolvers,
  ...userResolvers,
  ...organizationResolvers,
  ...planResolvers,
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
  ...balanceLineItemResolvers,
  ...rootMutations
}
