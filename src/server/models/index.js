import DataLoader from 'dataloader'
import Assignment from './assignment'
import BalanceLineItem from './balance-line-item'
import Campaign from './campaign'
import CampaignContact from './campaign-contact'
import InteractionStep from './interaction-step'
import Message from './message'
import OptOut from './opt-out'
import PendingMessagePart from './pending-message-part'
import Plan from './plan'
import Organization from './organization'
import CannedResponse from './canned-response'
import QuestionResponse from './question-response'
import UserCell from './user-cell'
import UserOrganization from './user-organization'
import User from './user'
import Invite from './invite'
import ZipCode from './zip-code'
import JobRequest from './job-request'
import thinky from './thinky'

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
  plan: createLoader(Plan),
  user: createLoader(User),
  interactionStep: createLoader(InteractionStep),
  campaignContact: createLoader(CampaignContact),
  zipCode: createLoader(ZipCode, 'zip')
})

const r = thinky.r

export {
  createLoaders,
  r,
  Assignment,
  BalanceLineItem,
  Campaign,
  CampaignContact,
  InteractionStep,
  Invite,
  JobRequest,
  Message,
  OptOut,
  Organization,
  PendingMessagePart,
  Plan,
  CannedResponse,
  QuestionResponse,
  UserCell,
  UserOrganization,
  User,
  ZipCode
}
