// we will use supertest to test HTTP requests/responses
import {graphql} from "graphql";

const MYDELAY = 60000

const request = require("supertest");
// we also need our app for the correct routes!
process.env.OSDI_SERVER_ENABLE = 1

import {CampaignContact, QuestionResponse, r} from '../../../src/server/models/'
import {newUUID, getHash} from '../../../src/server/api/osdi/guid'

import {dataQuery as TexterTodoListQuery} from '../../../src/containers/TexterTodoList'
import {dataQuery as TexterTodoQuery} from '../../../src/containers/TexterTodo'
import {campaignDataQuery as AdminCampaignEditQuery} from '../../../src/containers/AdminCampaignEdit'

import {makeTree} from '../../../src/lib'
import { log } from '../../../src/lib'

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
    sendMessage, enableOSDI, getContext
} from '../../test_helpers'

import {_} from 'lodash'
import osdiPush from '../../../src/server/api/osdi/osdiPush'
import osdiUtil from '../../../src/server/api/osdi/osdiUtil'

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser
let testTexterUser2
let testContacts
let organizationId
let assignmentId
let testContact
let testScript
let testCustomFieldValue='foosoo'.concat(Date.now())

export async function createTestyContact(campaign) {
    const campaignId = campaign.id

    const contact = new CampaignContact({
        first_name: `Testy`,
        last_name: `McTesterson`,
        cell: '5555555555',
        zip: '12345',
        campaign_id: campaignId,
        custom_fields: {
            email: 'testy.mctesterson@fake.osdi.info',
            test_field: testCustomFieldValue
        }
    })
    const result=await contact.save()

    return result
}

describe("Use Spoke infrastructure", async () => {

    beforeEach(async () => {

        // Set up an entire working campaign
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
        await createScript(testAdminUser, testCampaign)
        // await startCampaign(testAdminUser, testCampaign)
        testContact = await createTestyContact(testCampaign)
        testScript=await createScript(testAdminUser, testCampaign, undefined, 2)

    }, MYDELAY)

    afterEach(async () => {
        await cleanupTest()
        if (r.redis) r.redis.flushdb()
    }, MYDELAY)

    test("cache_test", async () => {
        process.env.OSDI_OUTBOUND_USE_SAMPLE='true'

        const choices=await osdiPush.getActions()

        const choiceNames = choices.map(function(c) {
            return c.name
        })

        const matches=[
            "osdi:tag|volunteers|http://spoke.fake.osdi.info/api/v1/tags/28",
            "osdi:question|red|http://spoke.fake.osdi.info/api/v1/questions/26"
        ]

        matches.forEach(function(m) {
            expect(choiceNames).toContain(m)
        })

    })


    // for use with real OSDI AEP
    test.skip("push_action", async () => {
        jest.setTimeout(1 * 60 * 1000)

        var data=await osdiPush.getCache()
        var choices=osdiPush.choices(data)
        const qchoices = choices.filter(function(choice) {
            return choice.type === "question"
        })

        const qchoice=qchoices.pop()
        const question_parts=qchoice.name.split('|')
        const question_action={
            type: question_parts[0],
            response_key: question_parts[1],
            url: question_parts[2]
        }

        const contactId=testContact.id;
        const contact = await getCampaignContact(contactId)

        console.log(JSON.stringify(contact))

        const response=await osdiPush.personSignupHelper(contact)

        const obj = await response.json()
        console.log(JSON.stringify(obj))

        const canvass_url=obj._links["osdi:record_canvass_helper"].href
        const client=osdiPush.client()
        const canvass_resource=client.getResource(canvass_url)
        const canvass={
            canvass: {
                contact_type: 'phone',
                action_date: '2019-10-01'
            },
            add_answers: [
                {
                    question: question_action.url,
                    responses: [
                        question_action.response_key
                    ]
                }
            ]

        }

        const canvass_json=JSON.stringify(canvass)
        console.log(canvass_json)

        const init={
            method: 'POST',
            body: canvass_json,
            headers: {
                'content-type': 'application/json'
            }
        }

        const cresponse = await client.fetch(canvass_url,init)
        const cobj = await cresponse.text()

        console.log((cobj))


    })

    test("push_handler", async () => {
        jest.setTimeout(1 * 60 * 1000)

        var choices=await osdiPush.getActions()
        const qchoices = choices.filter(function(choice) {
            return choice.type === "question"
        })

        const qchoice=qchoices.pop()


        osdiUtil.logOSDI(testContact)
        const campaignContactId=testContact.id;

        const result=await osdiPush.processAction(qchoice.name,undefined, undefined, campaignContactId)
        osdiUtil.logOSDI(result)
        expect(result.signup.given_name).toEqual('Testy')

        if ( ! osdiPush.useSample() ) {
            const activist_code = choices.filter(function (choice) {
                return choice.type === "tag_activist_code"
            }).pop()

            const result2 = await osdiPush.processAction(activist_code.name, undefined, undefined, campaignContactId)
            osdiUtil.logOSDI(result2)
            expect(result2.signup).toEqual({})
        }
    })


    test("push_signup", async () => {
        const action_name='osdi:signup|signup|signup'
        const campaignContactId=testContact.id;
        const result=await osdiPush.processAction(action_name,undefined, undefined, campaignContactId)
        const resultFieldValue = _.get(result,'signup.custom_fields.test_field')
        expect(resultFieldValue).toEqual(testCustomFieldValue)


    })


    test("psh_test", async () => {
        const contactId=testContact.id;
        const contact = await getCampaignContact(contactId)

        const result= await osdiPush.personSignupHelper(contact)

    })

    test("push_cache", async () => {
        process.env.OSDI_OUTBOUND_DISABLE_CACHE=false

        await osdiPush.getActions()
        await osdiPush.getActions()
        // eyeball log and see 2 download actions instead of one in the cached case
        expect(true).toEqual(true)
    })
})


describe("Bare OSDI only", async () => {
    test("It downloads cache", async () => {


        let osdiCache = {}

        let ketting = osdiPush.client()

        let remoteQuestions = await osdiPush.slurpCollection(ketting, 'osdi:questions')

        let cachedQuestions = remoteQuestions.filter(function (q) {
            return q.body['question_type'] === 'SingleChoice'
        })

        osdiCache['osdi:questions'] = cachedQuestions

        osdiCache['osdi:tags'] = (await osdiPush.slurpCollection(ketting, 'osdi:tags'))


        console.log(osdiUtil.prettyOSDI(osdiCache))

        let uiChoices = osdiPush.choices(osdiCache)
        console.log(osdiUtil.prettyOSDI(uiChoices))


    });


})
