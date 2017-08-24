import DataLoader from 'dataloader'
import Assignment from './assignment'
import Campaign from './campaign'
import CampaignContact from './campaign-contact'
import InteractionStep from './interaction-step'
import Message from './message'
import OptOut from './opt-out'
import PendingMessagePart from './pending-message-part'
import Organization from './organization'
import CannedResponse from './canned-response'
import QuestionResponse from './question-response'
import UserCell from './user-cell'
import UserOrganization from './user-organization'
import User from './user'
import Invite from './invite'
import ZipCode from './zip-code'
import JobRequest from './job-request'
import Migrations from './migrations'
import thinky from './thinky'
import datawarehouse from './datawarehouse'

function createLoader(model, idKey = 'id') {
  return new DataLoader(async (keys) => {
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
  zipCode: createLoader(ZipCode, 'zip')
})

const r = thinky.r

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
  ZipCode
}
