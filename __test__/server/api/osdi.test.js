// we will use supertest to test HTTP requests/responses
import {graphql} from "graphql";

const request = require("supertest");
// we also need our app for the correct routes!

//import app from '../../../src/server'

import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'

import { r } from '../../../src/server/models/'
/*
import { newUUID, getHash } from '../../../src/server/api/osdi/guid'


import { dataQuery as TexterTodoListQuery } from '../../../src/containers/TexterTodoList'
import { dataQuery as TexterTodoQuery } from '../../../src/containers/TexterTodo'
import { campaignDataQuery as AdminCampaignEditQuery } from '../../../src/containers/AdminCampaignEdit'

import {
    bulkReassignCampaignContactsMutation,
    reassignCampaignContactsMutation
} from '../../../src/containers/AdminIncomingMessageList'
import { makeTree } from '../../../src/lib'

*/


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
//import app from "../../../src/server";
import osdi from "../../../src/server/api/osdi";

let testAdminUser
let testInvite
let testOrganization
let testCampaign
let testTexterUser
let testTexterUser2
let testContacts
let organizationId
let assignmentId
let app

function appSetup(){
    const napp = express()

    napp.use(bodyParser.json({ limit: '50mb' }))
    napp.use(bodyParser.urlencoded({ extended: true }))
    osdi.startIfEnabled(napp);

    const server = napp.listen(3000)
    return napp

}

describe("osdi.server infrastructure", async () => {

    beforeEach(async () => {

        process.env.OSDI_MASTER_ENABLE = 'true'
        process.env.BASE_URL = 'http://spoke.loopback.site:3000'

        // Set up an entire working campaign
        console.log("JOBS SYNC ".concat(process.env.OSDI_MASTER_ENABLE))
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
        app = appSetup()

        console.log('endbefore')
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)

    afterEach(async () => {
        await cleanupTest()
        if (r.redis) r.redis.flushdb()
    }, global.DATABASE_SETUP_TEARDOWN_TIMEOUT)


    test("It should get osdi people", async () => {

        const apiToken = 'sexualorientationgenderidentity'

        let tosdi = await enableOSDI(testOrganization, testAdminUser, apiToken)

        let response = await request(app).get("/osdi/org/1/campaigns/1/api/v1/people?per_page=5").set("OSDI-API-Token", apiToken)

        expect(response.statusCode).toBe(200);
        let osdiResponse = response.body

        expect(osdiResponse.total_records).toBe(100)

        let osdiPeople = osdiResponse._embedded['osdi:people']

        expect(osdiPeople.length).toBe(5)

        let osdiPerson = osdiPeople[0]

        expect(osdiPerson.given_name).toEqual('Ann0')

        // try with bad apitoken
        response = await request(app).get("/osdi/org/1/campaigns/1/api/v1/people?per_page=5").set("OSDI-API-Token", 'homophobia')

        expect(response.statusCode).toBe(403)
    });


    test("It should fail because OSDI is disabled", async () => {

        const apiToken = 'sexualorientationgenderidentity'

        let response = await request(app).get("/osdi/org/1/campaigns/1/api/v1/people?per_page=5").set("OSDI-API-Token", apiToken)

        expect(response.statusCode).toBe(510);

    });

})
