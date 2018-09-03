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
import Migrations from './migrations'
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

const r = thinky.r

function createLoader(model, idKey = 'id', cacheFunction) {
  return new DataLoader(async (keys) => {
    if (cacheFunction && r.redis) {
      const cachedData = await cacheFunction(keys)
      if (cachedData) {
        return cachedData
      }
    }
    const docs = await model.getAll(...keys, { index: idKey })
    return keys.map((key) => (
      docs.find((doc) => doc[idKey].toString() === key.toString())
    ))
  })
}

const createLoaders = () => ({
  assignment: createLoader(Assignment),
  campaign: createLoader(Campaign),
  invite: createLoader(Invite),
  organization: createLoader(Organization),
  user: createLoader(User),
  interactionStep: createLoader(InteractionStep),
  campaignContact: createLoader(CampaignContact),
  zipCode: createLoader(ZipCode, 'zip'),
  log: createLoader(Log),
  cannedResponse: createLoader(CannedResponse),
  jobRequest: createLoader(JobRequest),
  message: createLoader(Message),
  migrations: createLoader(Migrations),
  optOut: createLoader(OptOut),
  pendingMessagePart: createLoader(PendingMessagePart),
  questionResponse: createLoader(QuestionResponse),
  userCell: createLoader(UserCell),
  userOrganization: createLoader(UserOrganization)
})

export {
  createLoaders,
  r,
  datawarehouse,
  Migrations,
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
