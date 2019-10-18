import {r, loaders} from '../../models'
import _ from 'lodash'
import {Ketting} from 'ketting'
import osdiUtil from './osdiUtil'
import osdiTranslate from './osdiTranslate'
import {getProcessEnvTz, log} from "../../../lib";
import moment from "moment-timezone";


export const useSample = osdiUtil.truthy(process.env.OSDI_OUTBOUND_USE_SAMPLE)
const osdiOutboundAEP = process.env.OSDI_OUTBOUND_AEP || 'https://osdi.ngpvan.com/api/v1'
const osdiOutboundAPIToken = process.env.OSDI_OUTBOUND_API_TOKEN

const cacheKey = (id) => `${process.env.CACHE_PREFIX || ''}osdi-${id}`

export function enabled() {
    var res=_.isString(osdiOutboundAPIToken)
    return (res)
}

async function slurpCollection(ketting, rel) {
    let resourceCollection = await ketting.follow(rel)
    let resources = await resourceCollection.followAll(rel)

    let resource_array = await Promise.all(resources.map(async function (r) {
        const rr = await r.representation()
        return rr
    }))
    return resource_array
}

export function client() {
    const osdiPushConfig = {
        ApiToken: osdiOutboundAPIToken,
        AEP: osdiOutboundAEP

    }
    let osdiOptions = {
        fetchInit: {
            headers: {
                "OSDI-API-Token": osdiPushConfig.ApiToken
            }
        },
        contentType: 'application/json'
    }

    const ketting = new Ketting(osdiPushConfig.AEP, osdiOptions)

    return ketting
}

export function choiceName(obj,rel, action_key){
    let self_url = obj.uri

    let name = _.join([
        rel,
        action_key,
        self_url
    ],'|')
    return name

}

export function questionChoices(osdiCache) {

    let qChoices = osdiCache['osdi:questions'].map(function (q) {
        const body = q.body
        const response_keys = (function (r) {
            return r.key
        })

        const display_text = body.description || body.name
        return q.body.responses.map(function (response) {

            let name = choiceName(q,'osdi:question',response.key)

            let choice = {
                type: 'question',
                name: name,
                display_name: "Q [".concat(body.name, "] => A [", response.name,"]"),
                instructions: "Answer ".concat(display_text, " with: ",response.name)
            }
            return choice

        })
    })

    let flatChoices = _.flatten(qChoices)
    return flatChoices

}

export function tagChoices(osdiCache) {
    let tChoices = osdiCache['osdi:tags'].map(function (t) {
        let body = t.body
        let identifier = body.identifiers[0]
        let identifier_parts=identifier.split(':')
        let action_key

        if (identifier_parts[0]==="VAN") {
            action_key=identifier_parts[1]
        } else {
            action_key=body.name
        }

        let choice = {
            type: 'tag_activist_code',
            name: choiceName(t,'osdi:tag',action_key),
            display_name: "Tag with ".concat(body.name),
            instructions: "Remotely apply Tag or Activist Code ".concat(body.name, " ID: ", identifier)
        }
        return choice
    })
    return tChoices
}

export function eventChoices(osdiCache) {
    return []
}

export function choices(osdiCache) {
    let choiceList = _.flatten([
            questionChoices(osdiCache),
            tagChoices(osdiCache),
            eventChoices(osdiCache)
        ]
    )
    return choiceList
}


export async function getCache() {
    var id='osdi_push_config'
    var cacheData

    if ( r.redis) {
        cacheData = await r.redis.getAsync(cacheKey(id))
        if (!cacheData) {
            cacheData = await loadCache()
        } else {
            cacheData = JSON.parse(cacheData)
        }
    } else {
        cacheData = await downloadCache()
    }
    return cacheData;

}

export async function loadCache(){
    var id='osdi_push_config'


    if (false) {
        return sampleCache()
    }

    const osdiCache=await downloadCache()

    await r.redis.multi()
        .set(cacheKey(id), JSON.stringify(osdiCache))
        .expire(cacheKey(id), 43200)
        .execAsync()
    return osdiCache
}

export async function downloadCache() {
    log.info("OSDI OUTBOUND: Downloading cache of response actions")

    let ketting = client()

    let osdiCache={}

    let remoteQuestions = await slurpCollection(ketting, 'osdi:questions')

    let cachedQuestions = remoteQuestions.filter(function (q) {
        return q.body['question_type'] === 'SingleChoice'
    })

    osdiCache['osdi:questions'] = cachedQuestions

    osdiCache['osdi:tags'] = (await slurpCollection(ketting, 'osdi:tags'))

    return osdiCache
}

export async function getActions() {
    const data=useSample ? sampleCache() : (await getCache())
    const actions=choices(data)
    return actions
}

export async function getCampaignContact(id) {
    return await loaders.campaignContact.load(id)
}

export function getCanvassUrl(osdi_identifier) {
    const id=osdi_identifier.split(':').pop()

    const url=osdiOutboundAEP.concat('/people/',id,'/record_canvass_helper')
    return url

}
export async function processAction(action, qr, interactionStep, campaignContactId ) {

    const contact=await getCampaignContact(campaignContactId)
    if (useSample){
        return {
            signup: osdiTranslate.contact_to_osdi_person(contact),
            canvass: {}
        }
    }

    let custom_fields
    if (contact.custom_fields) {
        custom_fields=JSON.parse(contact.custom_fields)
    }


    let pshResponse={}
    let canvassResponse
    let canvass_url

    let osdi_identifier

    if ( custom_fields.osdi_identifier) {
        osdi_identifier = custom_fields.osdi_identifier
    } else {
        // do person signup to match first
        pshResponse=await personSignupHelper(contact)
        osdi_identifier=pshResponse.identifiers[0].split(':').pop()
        custom_fields.osdi_identifier=osdi_identifier
        contact.custom_fields=JSON.stringify(custom_fields)
        await contact.save()
        osdiUtil.logOSDI()
    }

    canvass_url = getCanvassUrl(osdi_identifier)
    canvassResponse= await recordCanvass(canvass_url, action, contact)

    return {
        signup: pshResponse,
        canvass: canvassResponse
    }
}

export async function personSignupHelper(contact) {

    const pshrep = {
        person: osdiTranslate.contact_to_osdi_person(contact)
    }

    log.debug(JSON.stringify(pshrep))
    const oclient = client()
    const psh =await oclient.follow('osdi:person_signup_helper')

    const init={
        method: 'POST',
        body: JSON.stringify(pshrep),
        headers: {
            'content-type': 'application/json'
        }
    }
    const response = await psh.fetch(init)
    return response.json()

}


export async function recordCanvass(canvass_url, action,contact) {
    const oclient=client()
    const question_parts=action.split('|')
    const question_action={
        type: question_parts[0],
        response_key: question_parts[1],
        url: question_parts[2]
    }
    const canvass={
        canvass: {
            contact_type: 'phone',
            action_date: moment.tz(getProcessEnvTz()).format("YYYY-MM-DD")
        }
    }

    if (question_action.type==='osdi:question') {
        canvass.add_answers = [
            {
                question: question_action.url,
                responses: [
                    question_action.response_key
                ]
            }
        ]
    }
    if (question_action.type==='osdi:tag') {
        canvass.add_tags = [
            question_action.response_key
        ]
    }


    const canvass_json=JSON.stringify(canvass)
    log.debug(canvass_json)

    const init={
        method: 'POST',
        body: canvass_json,
        headers: {
            'content-type': 'application/json'
        }
    }

    const cresponse = await oclient.fetch(canvass_url,init)
    const cobj = await cresponse.json()
    return cobj

}

module.exports=  {
    client,
    slurpCollection,
    choices,
    processAction,
    getCache,
    enabled,
    personSignupHelper,
    getActions,
    useSample
}

export function sampleCache() {
    return {
        "osdi:questions": [
            {
                "uri": "http://spoke.fake.osdi.info/api/v1/questions/27",
                "contentType": "application/json; charset=utf-8",
                "body": {
                    "created_date": "2019-10-05T06:33:34.018Z",
                    "identifiers": [
                        "spokejoshco:27"
                    ],
                    "modified_date": "2019-10-05T06:34:20.646Z",
                    "name": "preferred_food",
                    "question_type": "SingleChoice",
                    "responses": [
                        {
                            "key": "pizza",
                            "name": "pizza",
                            "title": "pizza"
                        },
                        {
                            "key": "mud",
                            "name": "mud",
                            "title": "mud"
                        },
                        {
                            "key": "cookies",
                            "name": "cookies",
                            "title": "cookies"
                        }
                    ],
                    "title": "Do you prefer Pizza, Mud, or Cookies?"
                },
                "links": [
                    {
                        "templated": false,
                        "title": "preferred_food Do you prefer Pizza, Mud, or Cookies?",
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/questions/27",
                        "href": "http://spoke.fake.osdi.info/api/v1/questions/27",
                        "rel": "self"
                    },
                    {
                        "templated": false,
                        "title": null,
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/questions/27",
                        "href": "http://spoke.fake.osdi.info/api/v1/questions/27/answers",
                        "rel": "osdi:answers"
                    }
                ],
                "embedded": {}
            },
            {
                "uri": "http://spoke.fake.osdi.info/api/v1/questions/26",
                "contentType": "application/json; charset=utf-8",
                "body": {
                    "created_date": "2019-10-05T04:56:32.062Z",
                    "identifiers": [
                        "spokejoshco:26"
                    ],
                    "modified_date": "2019-10-05T04:56:32.062Z",
                    "name": "preferred_color",
                    "question_type": "SingleChoice",
                    "responses": [
                        {
                            "key": "blue",
                            "name": "blue",
                            "title": "Blue"
                        },
                        {
                            "key": "red",
                            "name": "red",
                            "title": "Red"
                        },
                        {
                            "key": "green",
                            "name": "green",
                            "title": "Green"
                        }
                    ],
                    "title": "Do you prefer Red, Green or Red?"
                },
                "links": [
                    {
                        "templated": false,
                        "title": "preferred_color Do you prefer Red, Green or Red?",
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/questions/26",
                        "href": "http://spoke.fake.osdi.info/api/v1/questions/26",
                        "rel": "self"
                    },
                    {
                        "templated": false,
                        "title": null,
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/questions/26",
                        "href": "http://spoke.fake.osdi.info/api/v1/questions/26/answers",
                        "rel": "osdi:answers"
                    }
                ],
                "embedded": {}
            }
        ],
        "osdi:tags": [
            {
                "uri": "http://spoke.fake.osdi.info/api/v1/tags/28",
                "contentType": "application/json; charset=utf-8",
                "body": {
                    "created_date": "2019-10-05T06:35:50.386Z",
                    "identifiers": [
                        "spokejoshco:28"
                    ],
                    "modified_date": "2019-10-05T06:35:50.386Z",
                    "name": "volunteers"
                },
                "links": [
                    {
                        "templated": false,
                        "title": "OsdiTag #28 volunteers",
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/tags/28",
                        "href": "http://spoke.fake.osdi.info/api/v1/tags/28",
                        "rel": "self"
                    },
                    {
                        "templated": false,
                        "title": null,
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/tags/28",
                        "href": "http://spoke.fake.osdi.info/api/v1/tags/28/taggings",
                        "rel": "osdi:taggings"
                    }
                ],
                "embedded": {}
            },
            {
                "uri": "http://spoke.fake.osdi.info/api/v1/tags/20",
                "contentType": "application/json; charset=utf-8",
                "body": {
                    "created_date": "2019-10-05T04:56:31.933Z",
                    "identifiers": [
                        "spokejoshco:20"
                    ],
                    "modified_date": "2019-10-05T04:56:31.933Z",
                    "name": "squeaky_wheels"
                },
                "links": [
                    {
                        "templated": false,
                        "title": "OsdiTag #20 squeaky_wheels",
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/tags/20",
                        "href": "http://spoke.fake.osdi.info/api/v1/tags/20",
                        "rel": "self"
                    },
                    {
                        "templated": false,
                        "title": null,
                        "type": null,
                        "context": "http://spoke.fake.osdi.info/api/v1/tags/20",
                        "href": "http://spoke.fake.osdi.info/api/v1/tags/20/taggings",
                        "rel": "osdi:taggings"
                    }
                ],
                "embedded": {}
            }
        ]
    }

}

