import DataLoader from 'dataloader'

// Import models in order that creates referenced tables before foreign keys
import User from './user'
import PendingMessagePart from './pending-message-part'
import Organization from './organization'
import Campaign from './campaign'
import Assignment from './assignment'
import CampaignContact from './campaign-contact'
import InteractionStep from './interaction-step'
import QuestionResponse from './question-response'
import OptOut from './opt-out'
import JobRequest from './job-request'
import Invite from './invite'
import CannedResponse from './canned-response'
import UserOrganization from './user-organization'
import UserCell from './user-cell'
import Message from './message'
import ZipCode from './zip-code'
import Log from './log'

import thinky from './thinky'
import datawarehouse from './datawarehouse'

import cacheableData from './cacheable_queries'

function createLoader(model, opts) {
  const idKey = (opts && opts.idKey) || 'id'
  const cacheObj = opts && opts.cacheObj
  const loader = new DataLoader(async (keys) => {
    if (cacheObj && cacheObj.load) {
      return keys.map(async (key) => await cacheObj.load(key))
    }
    const docs = await model.getAll(...keys, { index: idKey })
    return keys.map((key) => (
      docs.find((doc) => doc[idKey].toString() === key.toString())
    ))
  })
  return loader
}

// This is in dependency order, so tables are after their dependencies
const tableList = [
  'organization',
  'user',
  'campaign',
  'assignment',
  'campaign_contact',
  // the rest are alphabetical
  'canned_response',
  'interaction_step',
  'invite',
  'job_request',
  'log',
  'message',
  'opt_out',
  'pending_message_part',
  'question_response',
  'user_cell',
  'user_organization',
  'zip_code'
]

function createTablesIfNecessary() {
  // builds the database if we don't see the organization table
  return thinky.k.schema.hasTable('organization').then(
    (tableExists) => {
      if (!tableExists) {
        console.log('CREATING DATABASE SCHEMA')
        createTables()
        return true
      }
    })
}

function createTables() {
  return thinky.r.knex.migrate.latest()
}

function dropTables() {
  return thinky.dropTables(tableList).then(function() {
    return thinky.dropTables(['knex_migrations', 'knex_migrations_lock'])
  })
}

function getMessageServiceSid(organization) {
  const orgSid = organization.messageservice_sid
  if (!orgSid) {
    let orgFeatures = {}
    if (organization.features) {
      orgFeatures = JSON.parse(organization.features)
    }
    const service = orgFeatures.service || process.env.DEFAULT_SERVICE || ''
    if (service === 'twilio') {
      return process.env.TWILIO_MESSAGE_SERVICE_SID
    }
    return ''
  }
  return orgSid
}

const loaders = {
  // Note: loaders with cacheObj should also run loaders.XX.clear(id)
  //  on clear on the cache as well.
  assignment: createLoader(Assignment, { cacheObj: cacheableData.assignment }),
  campaign: createLoader(Campaign, { cacheObj: cacheableData.campaign }),
  invite: createLoader(Invite),
  organization: createLoader(Organization, { cacheObj: cacheableData.organization }),
  user: createLoader(User),
  interactionStep: createLoader(InteractionStep),
  campaignContact: createLoader(CampaignContact, { cacheObj: cacheableData.campaignContact }),
  zipCode: createLoader(ZipCode, { idKey: 'zip' }),
  log: createLoader(Log),
  cannedResponse: createLoader(CannedResponse),
  jobRequest: createLoader(JobRequest),
  message: createLoader(Message),
  optOut: createLoader(OptOut),
  pendingMessagePart: createLoader(PendingMessagePart),
  questionResponse: createLoader(QuestionResponse),
  userCell: createLoader(UserCell),
  userOrganization: createLoader(UserOrganization)
}

const createLoaders = () => loaders

const r = thinky.r

export {
  loaders,
  createLoaders,
  r,
  cacheableData,
  createTables,
  createTablesIfNecessary,
  dropTables,
  getMessageServiceSid,
  datawarehouse,
  Assignment,
  Campaign,
  CampaignContact,
  InteractionStep,
  Invite,
  JobRequest,
  Message,
  OptOut,
  Organization,
  PendingMessagePart,
  CannedResponse,
  QuestionResponse,
  UserCell,
  UserOrganization,
  User,
  ZipCode,
  Log
}
