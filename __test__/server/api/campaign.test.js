/* eslint-disable no-unused-expressions, consistent-return */
import { r } from '../../../src/server/models/'
import { dataQuery as TexterTodoListQuery } from '../../../src/containers/TexterTodoList'
import { dataQuery as TexterTodoQuery } from '../../../src/containers/TexterTodo'
import { campaignDataQuery as AdminCampaignEditQuery } from '../../../src/containers/AdminCampaignEdit'

import {
  bulkReassignCampaignContactsMutation,
  reassignCampaignContactsMutation
} from '../../../src/containers/AdminIncomingMessageList'

import { makeTree } from '../../../src/lib'

import {
  setupTest,
  cleanupTest,
  runComponentGql,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  saveCampaign,
  copyCampaign,
  createContacts,
  createTexter,
  assignTexter,
  createScript,
  createCannedResponses,
  startCampaign,
  getCampaignContact,
  sendMessage
} from '../../test_helpers'

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser
let testTexterUser2
let testContacts
let organizationId
let assignmentId

beforeEach(async () => {
  // Set up an entire working campaign
  if (r.redis) {
    await r.redis.flushdb()
  }
  await setupTest()
  testAdminUser = await createUser()
  testInvite = await createInvite()
  testOrganization = await createOrganization(testAdminUser, testInvite)
  organizationId = testOrganization.data.createOrganization.id
  testCampaign = await createCampaign(testAdminUser, testOrganization)
  testContacts = await createContacts(testCampaign, 100)
  testTexterUser = await createTexter(testOrganization)
  testTexterUser2 = await createTexter(testOrganization)
  await assignTexter(testAdminUser, testTexterUser, testCampaign)
  const dbCampaignContact = await getCampaignContact(testContacts[0].id)
  assignmentId = dbCampaignContact.assignment_id
  // await createScript(testAdminUser, testCampaign)
  // await startCampaign(testAdminUser, testCampaign)
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

afterEach(async () => {
  await cleanupTest()
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)


it('save campaign data, edit it, make sure the last value', async () => {
  let campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                                  { campaignId: testCampaign.id },
                                                  testAdminUser)

  expect(campaignDataResults.data.campaign.title).toEqual('test campaign')
  expect(campaignDataResults.data.campaign.description).toEqual('test description')

  let texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                        { organizationId },
                                                        testTexterUser)
  // empty before we start the campaign
  expect(texterCampaignDataResults.data.currentUser.todos).toEqual([])

  // now we start and confirm that we can access it
  await startCampaign(testAdminUser, testCampaign)
  texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                    { organizationId },
                                                    testTexterUser)
  console.log('TODOS', texterCampaignDataResults.data.currentUser)
  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.title).toEqual('test campaign')
  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.description).toEqual('test description')

  // now we modify it, and confirm that it changes

  const savedCampaign = await saveCampaign(testAdminUser,
                                           { id: testCampaign.id,
                                            organizationId },
                                           'test campaign new title')
  expect(savedCampaign.title).toEqual('test campaign new title')

  campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                              { campaignId: testCampaign.id },
                                              testAdminUser)

  texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                    { organizationId },
                                                    testTexterUser)

  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.title).toEqual('test campaign new title')
})


it('save campaign interaction steps, edit it, make sure the last value is set', async () => {
  await createScript(testAdminUser, testCampaign)
  let campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                                  { campaignId: testCampaign.id },
                                                  testAdminUser)
  expect(campaignDataResults.data.campaign.interactionSteps.length).toEqual(2)
  expect(campaignDataResults.data.campaign.interactionSteps[0].questionText).toEqual('hmm0')
  expect(campaignDataResults.data.campaign.interactionSteps[1].questionText).toEqual('hmm1')
  expect(campaignDataResults.data.campaign.interactionSteps[0].script).toEqual('autorespond {zip}')
  expect(campaignDataResults.data.campaign.interactionSteps[1].script).toEqual('{lastName}')

  // save an update with a new questionText script
  const interactionStepsClone1 = makeTree(campaignDataResults.data.campaign.interactionSteps)
  interactionStepsClone1.interactionSteps[0].script = 'second save before campaign start'
  await createScript(testAdminUser, testCampaign, interactionStepsClone1)

  campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                              { campaignId: testCampaign.id },
                                              testAdminUser)
  expect(campaignDataResults.data.campaign.interactionSteps[1].script).toEqual('second save before campaign start')
  // save an update with a change to first text
  const interactionStepsClone2 = makeTree(campaignDataResults.data.campaign.interactionSteps)
  interactionStepsClone2.script = 'Hi {firstName}, please autorespond'
  await createScript(testAdminUser, testCampaign, interactionStepsClone2)

  campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                              { campaignId: testCampaign.id },
                                              testAdminUser)
  expect(campaignDataResults.data.campaign.interactionSteps[0].script).toEqual('Hi {firstName}, please autorespond')

  // CAMPAIGN START
  await startCampaign(testAdminUser, testCampaign)
  // now we start and confirm that we can access the script as a texter

  let texterCampaignDataResults = await runComponentGql(
    TexterTodoQuery,
    {
      contactsFilter: {
        messageStatus: 'needsMessage',
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId
    },
    testTexterUser)
  expect(
    texterCampaignDataResults.data.assignment.campaign.interactionSteps[0].script)
    .toEqual('Hi {firstName}, please autorespond')
  expect(
    texterCampaignDataResults.data.assignment.campaign.interactionSteps[1].script)
    .toEqual('second save before campaign start')

  // after campaign start: update script of first and second text and question text
  // verify both admin and texter queries
  const interactionStepsClone3 = makeTree(campaignDataResults.data.campaign.interactionSteps)
  interactionStepsClone3.script = 'Hi {firstName}, please autorespond -- after campaign start'
  interactionStepsClone3.interactionSteps[0].script = 'third save after campaign start'
  interactionStepsClone3.interactionSteps[0].questionText = 'hmm1 after campaign start'
  await createScript(testAdminUser, testCampaign, interactionStepsClone3)

  campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                              { campaignId: testCampaign.id },
                                              testAdminUser)
  expect(
    campaignDataResults.data.campaign.interactionSteps[0].script)
    .toEqual('Hi {firstName}, please autorespond -- after campaign start')
  expect(
    campaignDataResults.data.campaign.interactionSteps[1].script)
    .toEqual('third save after campaign start')
  expect(
    campaignDataResults.data.campaign.interactionSteps[1].questionText)
    .toEqual('hmm1 after campaign start')
  texterCampaignDataResults = await runComponentGql(TexterTodoQuery,
    {
      contactsFilter: {
        messageStatus: 'needsMessage',
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId
    },
                                                    testTexterUser)

  expect(
    texterCampaignDataResults.data.assignment.campaign.interactionSteps[0].script)
    .toEqual('Hi {firstName}, please autorespond -- after campaign start')
  expect(
    texterCampaignDataResults.data.assignment.campaign.interactionSteps[1].script)
    .toEqual('third save after campaign start')
  expect(
    texterCampaignDataResults.data.assignment.campaign.interactionSteps[1].question.text)
    .toEqual('hmm1 after campaign start')

  // COPIED CAMPAIGN
  const copiedCampaign1 = await copyCampaign(testCampaign.id, testAdminUser)
  // 2nd campaign to test against https://github.com/MoveOnOrg/Spoke/issues/854
  const copiedCampaign2 = await copyCampaign(testCampaign.id, testAdminUser)
  expect(copiedCampaign1.data.copyCampaign.id).not.toEqual(testCampaign.id)

  const prevCampaignIsteps = campaignDataResults.data.campaign.interactionSteps
  const compareToLater = async (campaignId, prevCampaignIsteps) => {
    const campaignDataResults = await runComponentGql(
      AdminCampaignEditQuery, { campaignId: campaignId }, testAdminUser)

    expect(
      campaignDataResults.data.campaign.interactionSteps[0].script)
      .toEqual('Hi {firstName}, please autorespond -- after campaign start')
    expect(
      campaignDataResults.data.campaign.interactionSteps[1].script)
      .toEqual('third save after campaign start')
    expect(
      campaignDataResults.data.campaign.interactionSteps[1].questionText)
      .toEqual('hmm1 after campaign start')

    // make sure the copied steps are new ones
    expect(
      Number(campaignDataResults.data.campaign.interactionSteps[0].id))
      .toBeGreaterThan(Number(prevCampaignIsteps[1].id))
    expect(
      Number(campaignDataResults.data.campaign.interactionSteps[1].id))
      .toBeGreaterThan(Number(prevCampaignIsteps[1].id))
    return campaignDataResults
  }
  const campaign1Results = await compareToLater(copiedCampaign1.data.copyCampaign.id, prevCampaignIsteps)
  await compareToLater(copiedCampaign2.data.copyCampaign.id, prevCampaignIsteps)
  await compareToLater(copiedCampaign2.data.copyCampaign.id, campaign1Results.data.campaign.interactionSteps)


})

it('should save campaign canned responses across copies and match saved data', async () => {
  await createScript(testAdminUser, testCampaign)
  await createCannedResponses(testAdminUser, testCampaign,
                              [{title: "canned 1", text: "can1 {firstName}"},
                               {title: "canned 2", text: "can2 {firstName}"},
                               {title: "canned 3", text: "can3 {firstName}"},
                               {title: "canned 4", text: "can4 {firstName}"},
                               {title: "canned 5", text: "can5 {firstName}"},
                               {title: "canned 6", text: "can6 {firstName}"},
                              ])
  let campaignDataResults = await runComponentGql(
    AdminCampaignEditQuery, { campaignId: testCampaign.id }, testAdminUser)

  expect(campaignDataResults.data.campaign.cannedResponses.length).toEqual(6)
  for (let i=0; i<6; i++) {
    expect(campaignDataResults.data.campaign.cannedResponses[i].title).toEqual(`canned ${i+1}`)
    expect(campaignDataResults.data.campaign.cannedResponses[i].text).toEqual(`can${i+1} {firstName}`)
  }

  // COPY CAMPAIGN
  const copiedCampaign1 = await copyCampaign(testCampaign.id, testAdminUser)
  const copiedCampaign2 = await copyCampaign(testCampaign.id, testAdminUser)

 campaignDataResults = await runComponentGql(
    AdminCampaignEditQuery, { campaignId: copiedCampaign2.data.copyCampaign.id }, testAdminUser)
  expect(campaignDataResults.data.campaign.cannedResponses.length).toEqual(6)
  for (let i=0; i<6; i++) {
    expect(campaignDataResults.data.campaign.cannedResponses[i].title).toEqual(`canned ${i+1}`)
    expect(campaignDataResults.data.campaign.cannedResponses[i].text).toEqual(`can${i+1} {firstName}`)
  }
  campaignDataResults = await runComponentGql(
    AdminCampaignEditQuery, { campaignId: copiedCampaign1.data.copyCampaign.id }, testAdminUser)

  expect(campaignDataResults.data.campaign.cannedResponses.length).toEqual(6)
  for (let i=0; i<6; i++) {
    expect(campaignDataResults.data.campaign.cannedResponses[i].title).toEqual(`canned ${i+1}`)
    expect(campaignDataResults.data.campaign.cannedResponses[i].text).toEqual(`can${i+1} {firstName}`)
  }


})

describe('Reassignments', async () => {
  it('should allow reassignments before campaign start', async() => {
    // - user gets assignment todos
    // - assignments are changed in different ways (with different mutations)
    //   - and the current assignments are verified
    // - assign three texters 10 contacts each
    // - reassign 5 from one to another
    // - verify admin query texter counts are correct
    expect(true).toEqual(true)
  })


  it('should allow reassignments after campaign start', async () => {
    await createScript(testAdminUser, testCampaign)
    await startCampaign(testAdminUser, testCampaign)
    let texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)

    // TEXTER 1 (100 needsMessage)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(100)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(100)

    // send some texts
    for (let i=0; i<5; i++) {
      const messageResult = await sendMessage(testContacts[i].id, testTexterUser,
                                              { userId: testTexterUser.id,
                                                contactNumber: testContacts[i].cell,
                                                text: 'test text',
                                                assignmentId })
    }
    // TEXTER 1 (95 needsMessage, 5 needsResponse)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)

    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(95)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(100)
    // - reassign 5 from one to another
    // using editCampaign
    await assignTexter(testAdminUser, testTexterUser, testCampaign,
                       [{id: testTexterUser.id, needsMessageCount: 70, contactsCount: 100},
                        {id: testTexterUser2.id, needsMessageCount: 20}])
    // TEXTER 1 (70 needsMessage, 5 messaged)
    // TEXTER 2 (20 needsMessage)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)
    let texterCampaignDataResults2 = await runComponentGql(TexterTodoListQuery,
                                                           { organizationId },
                                                           testTexterUser2)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(70)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(75)

    const assignmentId2 = texterCampaignDataResults2.data.currentUser.todos[0].id
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(20)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(20)
    let assignmentContacts2 = texterCampaignDataResults.data.assignment.contacts
    for (let i=0; i<5; i++) {
      const contact = testContacts.filter(c => assignmentContacts2[i].id == c.id)[0]
      const messageResult = await sendMessage(contact.id, testTexterUser2,
                                              { userId: testTexterUser2.id,
                                                contactNumber: contact.cell,
                                                text: 'test text autorespond',
                                                assignmentId: assignmentId2 })
    }
    // TEXTER 1 (70 needsMessage, 5 messaged)
    // TEXTER 2 (15 needsMessage, 5 needsResponse)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)

    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(15)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(20)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsResponse',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(5)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(20)
    for (let i=0; i<3; i++) {
      const contact = testContacts.filter(c => texterCampaignDataResults.data.assignment.contacts[i].id == c.id)[0]
      const messageResult = await sendMessage(contact.id, testTexterUser2,
                                              { userId: testTexterUser2.id,
                                                contactNumber: contact.cell,
                                                text: 'keep talking',
                                                assignmentId: assignmentId2 })
    }
    // TEXTER 1 (70 needsMessage, 5 messaged)
    // TEXTER 2 (15 needsMessage, 2 needsResponse, 3 convo)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsResponse',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(2)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(20)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'convo',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)
    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(3)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(20)

    await assignTexter(testAdminUser, testTexterUser, testCampaign,
                       [{id: testTexterUser.id, needsMessageCount: 60, contactsCount: 75},
                        // contactsCount: 30 = 25 (desired needsMessage) + 5 (messaged)
                        {id: testTexterUser2.id, needsMessageCount: 25, contactsCount: 30}])
    // TEXTER 1 (60 needsMessage, 5 messaged)
    // TEXTER 2 (25 needsMessage, 2 needsResponse, 3 convo)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)

    texterCampaignDataResults2 = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsMessage',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)


    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(60)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(65)
    expect(texterCampaignDataResults2.data.assignment.contacts.length).toEqual(25)
    expect(texterCampaignDataResults2.data.assignment.allContactsCount).toEqual(30)

    // maybe test no intersections of texted people and non-texted, and/or needsReply
    //   reassignCampaignContactsMutation
    await runComponentGql(
      reassignCampaignContactsMutation, { organizationId,
                                          newTexterUserId: testTexterUser2.id,
                                          campaignIdsContactIds: [
                                            { campaignId: testCampaign.id,
                                              // depending on testContacts[0] being
                                              // first message sent at top of text
                                              campaignContactId: testContacts[0].id,
                                              messageIds: [1]
                                            }
                                          ]
                                        }, testAdminUser)
    // TEXTER 1 (60 needsMessage, 4 messaged)
    // TEXTER 2 (25 needsMessage, 2 needsResponse, 3 convo, 1 messaged)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'messaged',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)

    texterCampaignDataResults2 = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'messaged',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)


    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(4)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(64)
    expect(texterCampaignDataResults2.data.assignment.contacts.length).toEqual(1)
    expect(texterCampaignDataResults2.data.assignment.allContactsCount).toEqual(31)

    //   bulkReassignCampaignContactsMutation
    await runComponentGql(
      bulkReassignCampaignContactsMutation, {
        organizationId,
        contactsFilter: { messageStatus: 'needsResponse',
                          isOptedOut: false,
                          validTimezone: true },
        campaignsFilter: { campaignId: testCampaign.id },
        assignmentsFilter: { texterId: testTexterUser2.id },
        newTexterUserId: testTexterUser.id
      }, testAdminUser)
    // TEXTER 1 (60 needsMessage, 2 needsResponse, 4 messaged)
    // TEXTER 2 (25 needsMessage, 3 convo, 1 messaged)
    texterCampaignDataResults = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsResponse',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId
      },
      testTexterUser)

    texterCampaignDataResults2 = await runComponentGql(
      TexterTodoQuery,
      { contactsFilter: { messageStatus: 'needsResponse',
                          isOptedOut: false,
                          validTimezone: true },
        assignmentId: assignmentId2
      },
      testTexterUser2)

    expect(texterCampaignDataResults.data.assignment.contacts.length).toEqual(2)
    expect(texterCampaignDataResults.data.assignment.allContactsCount).toEqual(66)
    expect(texterCampaignDataResults2.data.assignment.contacts.length).toEqual(0)
    expect(texterCampaignDataResults2.data.assignment.allContactsCount).toEqual(29)
  })
})
