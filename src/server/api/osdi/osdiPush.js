import {r, loaders} from '../../models'
import _ from 'lodash'
import {Ketting} from 'ketting'
import osdiUtil from './osdiUtil'
import osdiTranslate from './osdiTranslate'
import {getProcessEnvTz, log} from "../../../lib";
import moment from "moment-timezone";


export function useSample() { return osdiUtil.truthy(process.env.OSDI_OUTBOUND_USE_SAMPLE) }

export function osdiOutboundAEP() {
    return process.env.OSDI_OUTBOUND_AEP || 'https://osdi.ngpvan.com/api/v1'
}

function osdiOutboundAPIToken() {
  return process.env.OSDI_OUTBOUND_API_TOKEN
}

const cacheKey = (id) => `${process.env.CACHE_PREFIX || ''}osdi-${id}`

export function enabled() {
    var res=_.isString(osdiOutboundAPIToken())
    return (res)
}

async function hasRel(ketting,rel) {
    const aepResource = ketting.getResource()
    const links = await aepResource.links()
    const linkRels = links.map((l) => {
        return l.rel
    })
    return linkRels.includes(rel)
}
async function slurpCollection(ketting, rel) {
    var resource_array

    if ( await hasRel(ketting,rel )) {
        let resourceCollection = await ketting.follow(rel)
        let resources = await resourceCollection.followAll(rel)

        resource_array = await Promise.all(resources.map(async function (r) {
            const rr = await r.representation()
            return rr
        }))
    } else {
        log.warn("No ".concat(rel, " Collection on OSDI system"))
        resource_array = []
    }
    return resource_array
}

export function client() {
    const osdiPushConfig = {
        ApiToken: osdiOutboundAPIToken(),
        AEP: osdiOutboundAEP()

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
                display_name: [
                    "[",
                _.truncate(response.name,20),
                "] ",
                osdiUtil.st(display_text,40)
            ].join(''),
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
            instructions: "Tag/AC ".concat(body.name, " ID: ", identifier)
        }
        return choice
    })
    return tChoices
}

export function eventChoices(osdiCache) {
    return []
}

function signupChoices(osdiCache) {
    return [
        {
            type: 'signup',
            name: 'osdi:signup|signup|signup',
            display_name: 'Person Signup Helper',
            instructions: 'Invoke a standard osdi:person_signup_helper action'
        }
    ]
}

export function choices(osdiCache) {
    let choiceList = _.flatten([
            signupChoices(osdiCache),
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

    if ( r.redis && (!osdiUtil.truthy(process.env.OSDI_DISABLE_OUTBOUND_CACHE))) {
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
        .expire(cacheKey(id), 120)
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

export async function getActions(options) {
    const data=useSample() ? sampleCache() : (await getCache(options))
    const actions=choices(data)
    osdiUtil.logOSDI(actions)
    return actions
}

export async function getCampaignContact(id) {
    return await loaders.campaignContact.load(id)
}

export function getCanvassUrl(osdi_identifier) {
    const id=osdi_identifier.split(':').pop()

    const url=osdiOutboundAEP().concat('/people/',id,'/record_canvass_helper')
    return url

}
export async function processAction(action, qr, interactionStep, campaignContactId ) {

    osdiUtil.logOSDI([
        "Processing OSDI Action ", action, "ContactID", campaignContactId
    ])

    const action_object = crackAction(action)

    const contact=await getCampaignContact(campaignContactId)
    if (useSample()){
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
    let canvassResponse={}
    let canvass_url

    let osdi_identifier

    if ( custom_fields.osdi_identifier && (action_object.type != 'osdi:signup' )) {
        osdi_identifier = custom_fields.osdi_identifier
    } else {
        // do person signup to match first
        pshResponse=await personSignupHelper(contact)
        osdi_identifier=pshResponse.identifiers[0].split(':').pop()
        custom_fields.osdi_identifier=osdi_identifier
        contact.custom_fields=JSON.stringify(custom_fields)
        await contact.save()
    }


    if (action_object.type != 'osdi:signup' ) {
        canvass_url = getCanvassUrl(osdi_identifier)
        canvassResponse = await recordCanvass(canvass_url, action, contact)
    }
    const result= {
        message: "OSDI Responses for signup and canvass",
        signup: pshResponse,
        canvass: canvassResponse
    }

    osdiUtil.logOSDI(result)
    return result
}

export async function personSignupHelper(contact) {

    const pshrep = {
        person: osdiTranslate.contact_to_osdi_person(contact)
    }

    osdiUtil.logOSDI([
        "Posting Person Signup Helper:",
        pshrep
    ])
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

export function crackAction(action) {
    const question_parts=action.split('|')
    const action_object={
        type: question_parts[0],
        response_key: question_parts[1],
        url: question_parts[2]
    }
    return action_object
}

export async function recordCanvass(canvass_url, actions,contact) {
    const oclient=client()


    const canvass={
        canvass: {
            contact_type: 'phone',
            action_date: moment.tz(getProcessEnvTz()).format("YYYY-MM-DD")
        }
    }

    let add_answers=[], add_tags=[]

    actions.split(',').forEach(function(action) {
        let question_action = crackAction(action)


        if (question_action.type === 'osdi:question') {
            add_answers.push(
                {
                    question: question_action.url,
                    responses: [
                        question_action.response_key
                    ]
                }
            )

        }
        if (question_action.type === 'osdi:tag') {
            add_tags.push(
                question_action.response_key
            )
        }
    })

    canvass.add_answers = add_answers
    canvass.add_tags = add_tags

    const canvass_json=JSON.stringify(canvass)

    osdiUtil.logOSDI([
        "Posting canvass_record_helper",
        canvass
    ])


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

export async function clearOsdiIdentifiers() {
    const contacts = await r.knex('campaign_contact')
        .whereRaw("custom_fields ilike '%osdi_identifier%'")

    const rows=contacts.length

    const updates = Promise.all(contacts.map( async function(c) {
        let custom_fields = c.custom_fields
        if (custom_fields) {
            let new_fields = JSON.stringify(_.omit(JSON.parse(custom_fields), ['osdi_identifier']))
            await r.knex('campaign_contact')
                .where({id: c.id})
                .update({custom_fields: new_fields})

        }
    }))


    return rows
}

export async function configuredInteractionSteps() {
    const osdiSteps = await r.knex('interaction_step')
        .select('interaction_step.*','isp.question as pq')
        .from('interaction_step')
        .joinRaw('join interaction_step as isp on interaction_step.parent_interaction_id = isp.id',)
        .whereRaw("interaction_step.answer_actions ilike 'osdi:%'").limit(10)
        .orderBy('interaction_step.campaign_id','asc')
        .orderBy('interaction_step.id','asc')

    osdiUtil.logOSDI(osdiSteps)


    return osdiSteps
}

export async function clearConfiguredInteractionSteps() {
    const isteps=await configuredInteractionSteps()
    const matchString = 'osdi:'


    await Promise.all(isteps.map(async (i) => {

        const removed =

            _.join(
                _.reject(
                    _.split( i.answer_actions,','),
                    (s) => {
                        return _.startsWith(s, matchString)
                    }),
                ',')


        osdiUtil.logCLI("Old ".concat(i.answer_actions, " NEW ", removed))

        const update = await r.knex
            .from('interaction_step')
            .where({id: i.id})
            .update({answer_actions: removed})


        return update
    }))
    return isteps.length
}

export async function addOsdiIdentifiers() {
    const contacts = await r.knex('campaign_contact')
        .limit(20)



    const updates = Promise.all((contacts.map( async function(c) {
        let custom_fields = c.custom_fields
        if (custom_fields) {
            let new_fields = JSON.stringify(_.assign(JSON.parse(custom_fields), {'osdi_identifier': 'deadbeef'}))
            return await r.knex('campaign_contact')
                .where({id: c.id})
                .update({custom_fields: new_fields})

        }
    })))


    return updates
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
    useSample,
    osdiOutboundAEP,
    clearOsdiIdentifiers,
    addOsdiIdentifiers,
    configuredInteractionSteps,
    clearConfiguredInteractionSteps,
    crackAction
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

