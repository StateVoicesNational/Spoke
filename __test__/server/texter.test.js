/* eslint-disable no-unused-expressions, consistent-return */
import { r } from '../../src/server/models/'
import {
  runGql,
  setupTest,
  cleanupTest,
  getGql,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  createContact,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact
} from '../test_helpers'
import waitForExpect from 'wait-for-expect'

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser
let testContact
let assignmentId

beforeEach(async () => {
  // Set up an entire working campaign
  await setupTest()
  testAdminUser = await createUser()
  testInvite = await createInvite()
  testOrganization = await createOrganization(testAdminUser, testInvite)
  testCampaign = await createCampaign(testAdminUser, testOrganization)
  testContact = await createContact(testCampaign)
  testTexterUser = await createTexter(testOrganization)
  await assignTexter(testAdminUser, testTexterUser, testCampaign)
  const dbCampaignContact = await getCampaignContact(testContact.id)
  assignmentId = dbCampaignContact.assignment_id
  await createScript(testAdminUser, testCampaign)
  await startCampaign(testAdminUser, testCampaign)
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

afterEach(async () => {
  await cleanupTest()
  if (r.redis) r.redis.flushdb()
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

it('should send an inital message to test contacts', async () => {
  const {
    query: [getContacts, getContactsVars],
    mutations
  } = getGql('../src/containers/TexterTodo', {
    messageStatus: 'needsMessage',
    params: { assignmentId }
  })

  const contactsResult = await runGql(getContacts, getContactsVars, testTexterUser)

  const [getAssignmentContacts, assignVars] = mutations.getAssignmentContacts(
    contactsResult.data.assignment.contacts.map(e => e.id),
    false
  )

  const ret2 = await runGql(getAssignmentContacts, assignVars, testTexterUser)
  const contact = ret2.data.getAssignmentContacts[0]

  const message = {
    contactNumber: contact.cell,
    userId: testTexterUser.id,
    text: 'test text',
    assignmentId
  }

  const [messageMutation, messageVars] = mutations.sendMessage(message, contact.id)

  const messageResult = await runGql(messageMutation, messageVars, testTexterUser)
  const campaignContact = messageResult.data.sendMessage

  // These things are expected to be returned from the sendMessage mutation
  expect(campaignContact.messageStatus).toBe('messaged')
  expect(campaignContact.messages.length).toBe(1)
  expect(campaignContact.messages[0].text).toBe(message.text)

  const expectedDbMessage = {
    user_id: testTexterUser.id,
    contact_number: testContact.cell,
    text: message.text,
    assignment_id: assignmentId,
    campaign_contact_id: testContact.id
  }

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex('message')
    expect(dbMessage.length).toEqual(2)
    expect(dbMessage[0]).toEqual(
      expect.objectContaining({
        send_status: 'SENDING',
        ...expectedDbMessage
      })
    )
    expect(dbMessage[1]).toEqual(
      expect.objectContaining({
        send_status: 'SENT',
        ...expectedDbMessage
      })
    )
    const dbCampaignContact = await getCampaignContact(testContact.id)
    expect(dbCampaignContact.message_status).toBe('messaged')
  })

  // Refetch the contacts via gql to check the caching
  const ret3 = await runGql(getAssignmentContacts, assignVars, testTexterUser)
  expect(ret3.data.getAssignmentContacts[0].messageStatus).toEqual('messaged')
})

it('should be able to receive a response and reply (using fakeService)', async () => {
  const {
    query: [getContacts, getContactsVars],
    mutations
  } = getGql('../src/containers/TexterTodo', {
    messageStatus: 'needsMessage',
    params: { assignmentId }
  })

  const contactsResult = await runGql(getContacts, getContactsVars, testTexterUser)

  const [getAssignmentContacts, assignVars] = mutations.getAssignmentContacts(
    contactsResult.data.assignment.contacts.map(e => e.id),
    false
  )

  const ret2 = await runGql(getAssignmentContacts, assignVars, testTexterUser)
  const contact = ret2.data.getAssignmentContacts[0]

  const message = {
    contactNumber: contact.cell,
    userId: testTexterUser.id,
    text: 'test text autorespond',
    assignmentId
  }

  const [messageMutation, messageVars] = mutations.sendMessage(message, contact.id)

  await runGql(messageMutation, messageVars, testTexterUser)

  // wait for fakeservice to autorespond
  await waitForExpect(async () => {
    const dbMessage = await r.knex('message')
    expect(dbMessage.length).toEqual(3)
    expect(dbMessage[2]).toEqual(
      expect.objectContaining({
        send_status: 'DELIVERED',
        text: `responding to ${message.text}`,
        user_id: testTexterUser.id,
        contact_number: testContact.cell,
        assignment_id: assignmentId,
        campaign_contact_id: testContact.id
      })
    )
  })

  await waitForExpect(async () => {
    const dbCampaignContact = await getCampaignContact(testContact.id)
    expect(dbCampaignContact.message_status).toBe('needsResponse')
  })

  // Refetch the contacts via gql to check the caching
  const ret3 = await runGql(getAssignmentContacts, assignVars, testTexterUser)
  expect(ret3.data.getAssignmentContacts[0].messageStatus).toEqual('needsResponse')

  // Then we reply
  const message2 = {
    contactNumber: contact.cell,
    userId: testTexterUser.id,
    text: 'reply',
    assignmentId
  }

  const [replyMutation, replyVars] = mutations.sendMessage(message2, contact.id)

  await runGql(replyMutation, replyVars, testTexterUser)

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex('message')
    expect(dbMessage.length).toEqual(5)
    expect(dbMessage[3]).toEqual(
      expect.objectContaining({
        send_status: 'SENDING'
      })
    )
    expect(dbMessage[4]).toEqual(
      expect.objectContaining({
        send_status: 'SENT'
      })
    )
    const dbCampaignContact = await getCampaignContact(testContact.id)
    expect(dbCampaignContact.message_status).toBe('convo')
  })

  // Refetch the contacts via gql to check the caching
  const ret4 = await runGql(getAssignmentContacts, assignVars, testTexterUser)
  expect(ret4.data.getAssignmentContacts[0].messageStatus).toEqual('convo')
})
