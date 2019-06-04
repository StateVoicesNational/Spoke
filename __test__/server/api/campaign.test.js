/* eslint-disable no-unused-expressions, consistent-return */
import { r } from '../../../src/server/models/'
import { resolvers as campaignResolvers } from '../../../src/server/api/campaign'
import { dataQuery as TexterTodoListQuery } from '../../../src/containers/TexterTodoList'
import { dataQuery as TexterTodoQuery } from '../../../src/containers/TexterTodo'
import { campaignDataQuery as AdminCampaignEditQuery } from '../../../src/containers/AdminCampaignEdit'
import { makeTree } from '../../../src/lib'

import {
  runGql,
  setupTest,
  cleanupTest,
  getGql,
  runComponentGql,
  getContext,
  createUser,
  createInvite,
  createOrganization,
  createCampaign,
  saveCampaign,
  createContact,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact
} from '../../test_helpers'
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
  // await createScript(testAdminUser, testCampaign)
  // await startCampaign(testAdminUser, testCampaign)
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

afterEach(async () => {
  await cleanupTest()
  if (r.redis) r.redis.flushdb()
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)


it('save campaign data, edit it, make sure the last value', async () => {
  let campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                                  { campaignId: testCampaign.id },
                                                  testAdminUser)

  expect(campaignDataResults.data.campaign.title).toEqual('test campaign')
  expect(campaignDataResults.data.campaign.description).toEqual('test description')

  const organizationId = testOrganization.data.createOrganization.id
  let texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                        {organizationId: organizationId},
                                                        testTexterUser)
  // empty before we start the campaign
  expect(texterCampaignDataResults.data.currentUser.todos).toEqual([])

  // now we start and confirm that we can access it
  await startCampaign(testAdminUser, testCampaign)
  texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                    {organizationId: organizationId},
                                                    testTexterUser)
  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.title).toEqual('test campaign')
  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.description).toEqual('test description')

  // now we modify it, and confirm that it changes

  const savedCampaign = await saveCampaign(testAdminUser,
                                           {id: testCampaign.id,
                                            organizationId: organizationId},
                                           'test campaign new title')
  expect(savedCampaign.title).toEqual('test campaign new title')

  campaignDataResults = await runComponentGql(AdminCampaignEditQuery,
                                              {campaignId: testCampaign.id},
                                              testAdminUser)

  texterCampaignDataResults = await runComponentGql(TexterTodoListQuery,
                                                    {organizationId: organizationId},
                                                    testTexterUser)

  expect(texterCampaignDataResults.data.currentUser.todos[0].campaign.title).toEqual('test campaign new title')
})



it('save campaign interaction steps, edit it, make sure the last value is set', async () => {
  const scriptResult = await createScript(testAdminUser, testCampaign)
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

  const organizationId = testOrganization.data.createOrganization.id
  let texterCampaignDataResults = await runComponentGql(TexterTodoQuery,
                                                        {
                                                          contactsFilter: {
                                                            messageStatus: 'needsMessage',
                                                            isOptedOut: false,
                                                            validTimezone: true
                                                          },
                                                          assignmentId: assignmentId
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
                                                      assignmentId: assignmentId
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
})
