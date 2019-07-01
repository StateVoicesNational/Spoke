import _ from 'lodash'
import apiAuth from './api-auth'
import { r } from '../../models'
import { log } from '../../../lib'

export const digDug = (p, o) => {
    return p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
};

function spoke_to_osdi_type(spoke_type) {
    var osdi;
    const map={
        'campaign_contact': 'person',
        'user': 'user',
        'question_response': 'answer',
        'interaction_step': 'question'
    }
    osdi=map[spoke_type]
    if (! osdi) {
        osdi=spoke_type;
    }
    return osdi
}
function translate_message_to_osdi(resource,req,options) {

    return {
        text: resource.text,
        inbound: resource.is_from_contact,
        contact_number: resource.contact_number,
        user_number: resource.user_number,
        send_status: resource.send_status,
        created_at: resource.created_at,
        sent_at: resource.sent_at,
        queued_at: resource.queued_at,
        assignment_id: resource.assignment_id

    }
}

function translate_user_to_osdi(resource,req,options){
    return {
        given_name: resource.first_name,
        family_name: resource.last_name,
        phone_numbers: [
            {
                number: resource.cell,
                number_type: 'Mobile'
            }
        ],
        email_addresses: [
            {
                address: resource.email
            }
        ],
        created_at: resource.created_at
    }
}

function translate_osdi_person_to_input_row(person) {
    const mobile=digDug(['phone_numbers',0,'number'],person);
    const email=digDug(['email_addresses',0,'address'],person);
    const zip=digDug(['postal_addresses',0,'postal_code'],person);

    var row= {
        first_name: person.given_name,
        last_name: person.family_name
    }

    if (email) {
        row.email = email
    }

    if (mobile) {
        row.cell = mobile
    }

    if ( zip ) {
        row.zip = zip
    }

    console.log(row);
    return row;
}

async function get_contact_from_mobile(mobile) {
    var contact=await r.knex('campaign_contact').where({cell: mobile}).orderBy('updated_at','desc').first()
    return contact
}

function osdiAEP(req) {
    return "".concat(process.env.BASE_URL,
        "/osdi/org/",
        req.params.orgId,
        "/campaigns/",
        req.params.campaignId,
        "/api/v1")
}

function should_show_native(req) {
    if ('osdi-diagnostics' in req.headers) {
        if ( req.headers['osdi-diagnostics'].includes('show_native') ) {
            return true
        }
    }
    return false
}

async function translate_resource_to_osdi(resource,req,options) {
    var self_href=options.single==true ? "".concat(process.env.BASE_URL, req.baseUrl) : "".concat(process.env.BASE_URL, req.baseUrl,"/", resource.id);

    let child_links=options.child_links || {};

    let resource_type=options.resource_type;

    var show_native = should_show_native(req)

    const identifiers=[
        "spoke".concat(
            ":",
            resource_type,
            "-",
            resource.id
        )
    ]
    var osdi={};

    var self_title=null;

    let _links={}

    osdi=resource
    osdi._spoke_native=true


    switch(true) {
        case resource_type=='campaign':
            req.campaignId=resource.id
            _links['osdi:aep']={
                href: "".concat(osdiAEP(req)),
                title: resource.title
            }
            break;
        case resource_type=='message':
            osdi=translate_message_to_osdi(resource,req,options)
            var contact;
            var contact_id;
            var user_id;

            if ( options.person_id ) {
                contact_id=options.person_id;
            } else {
                contact = await get_contact_from_mobile(resource.contact_number);
                contact_id = contact.id
            }

            _links['osdi:person']={
                href: "".concat(osdiAEP(req),"/people/", contact_id)
            }
            _links['spoke:assignment']={
                href: "".concat(osdiAEP(req),"/assignments/",resource.assignment_id)
            }
            break;

        case resource_type=='user':
            osdi=translate_user_to_osdi(resource,req,options)
            _links['spoke:assignments']={
                href: "".concat(osdiAEP(req),"/users/", resource.id, "/assignments" )
            }

            break;

        case resource_type=='assignment':
            _links['osdi:user']={
                href: "".concat(osdiAEP(req),"/users/",resource.user_id)
            }
            _links['osdi:messages']={
                href: "".concat(osdiAEP(req),"/assignments/",resource.id,"/messages")
            }
            break;

        case resource_type=='campaign_contact':
            osdi=translate_contact_to_osdi_person(resource,req)
            self_title= "".concat(resource['first_name'], " ", resource['last_name'])

            _links['osdi:answers']={
                href: "".concat(osdiAEP(req),"/people/", resource.id, "/answers")
            }

            _links['osdi:messages']={
                href: "".concat(osdiAEP(req),"/messages")
            }

            break;

        case resource_type=='question_response':
            osdi={
                value: resource.value,
                responses: [ resource.value ],
                created_date: resource.created_at,
                id: resource.id,
                question_id: resource.interaction_step_id
            }
            _links['osdi:question']={
                href: "".concat(osdiAEP(req),"/questions/",resource.interaction_step_id)
            }
            _links['osdi:person']={
                href: "".concat(osdiAEP(req),"/people/",resource.campaign_contact_id)
            }

            break;

        case resource_type=='interaction_step':

            osdi={
                description: resource.script,
                title: resource.question,
                name: resource.question,
                question_type: "SingleChoice",
                responses: _.map(resource.responses,function(response) {
                    return {
                        key: response,
                        name: response,
                        title: response
                    }
                }),
                id: resource.id,
                created_date: resource.created_at
            }

            _links['osdi:answers']={
                href: "".concat(osdiAEP(req),"/questions/",resource.id,"/answers")
            }

            break;

        default:

    }

    osdi.identifiers=identifiers;


    _links.self= {
            href: self_href
        }

    if ( self_title ) {
        _links.self.title=self_title;
    }

    Object.keys(child_links).forEach((key) => {
        _links[key] = {
            href: self_href.concat('/',child_links[key])
        };
    });

    osdi._links=_links;
    if (show_native && !(osdi._spoke_native==true)) {
        osdi._native=resource
    }
    return osdi;
}

function translate_message_to_osdi_message(message,req) {
    var self_href="".concat(process.env.BASE_URL,
        req.baseUrl,"/", message.id);


    const identifiers=[
        "spoke".concat(
            ":message",
            "-",
            message.id
        )
    ]
    var osdi={
        identifiers: identifiers,
        message: message,

    }

    osdi._links= {
        self: {
            href: self_href,
            title: "".concat("foobar")
        }
    };

    return osdi;
}

function translate_contact_to_osdi_person(contact,req) {
    var self_href="".concat(process.env.BASE_URL,
        req.baseUrl,"/", contact.id);

    var contact_custom_fields=contact.custom_fields;

    var all_custom_fields=JSON.parse(contact_custom_fields);
    var email=all_custom_fields['email'];
    var custom_fields=_.omit(all_custom_fields,['email']);
    var zip=contact.zip;


    const identifiers=[
        "spoke".concat(
            ":",
            contact.campaign_id,
            "-",
            contact.id
        )
    ]
    var osdi = {
        identifiers: identifiers,
        given_name: contact['first_name'],
        family_name: contact['last_name'],
        phone_numbers: [
            {
                number_type: "Mobile",
                number: contact['cell'],
                sms_capable: !(contact.is_opted_out)
            }
        ],

    };

    if (email) {
        osdi.email_addresses=[
            {
                address: email
            }
        ]
    }

    if (zip) {
        osdi.postal_addresses=[
            {
                postal_code: zip
            }
        ]
    }

    if (! _.isEmpty(custom_fields)) {
        osdi.custom_fields=custom_fields
    }

    return osdi;
}

function curies() {
    return [
        {
            "name": "osdi",
            "href": "http://opensupporter.github.io/osdi-docs/{rel}",
            "templated": true
        },
        {
            "name": "spoke",
            "href": "https://github.com/MoveOnOrg/Spoke"
        }
    ]

}
export async function AEP(req, res) {

    const baseUrl="".concat(process.env.BASE_URL,req.baseUrl);

    if (!['GET'].includes(req.method)) {
        res.writeHead(405, { Allow: 'GET' });
        res.end('Not allowed');
        return
    }
    var aep={
        motd: "Welcome to Spoke's OSDI Endpoint",
        _links: {
            "osdi:people": {
                href: baseUrl.concat("/people"),
                title: "The People Collection"
            },
            "osdi:users": {
                href: baseUrl.concat("/users"),
                title: "The Users Collection"
            },
            "osdi:person_signup_helper":{
                href: baseUrl.concat("/people"),
                title: "Person signup Helper"
            },
            "osdi:people_import_helper": {
                href: baseUrl.concat("/people"),
                title: "People Import Helper"
            },
            "osdi:questions": {
                href: baseUrl.concat("/questions"),
                title: "The Questions (interaction steps) collection"
            },
            "osdi:messages": {
                href: baseUrl.concat("/messages"),
                title: "The collection of SMS messages"
            },
            "spoke:assignments": {
                href: baseUrl.concat("/assignments"),
                title: "The collection of assignments"
            },
            "spoke:stats": {
                href: baseUrl.concat("/stats"),
                title: "Stats for this campaign"
            },
            curies:  curies()
        }
    };
    res.writeHead(200,{'Content-Type': 'application/json'});
    res.end(JSON.stringify(aep,null,2));
}

export async function campaignChooser(req,res) {

    const campaigns = await r
        .knex('campaign')
        .select()

    var osdi_campaigns= _.map(campaigns, function(campaign) {

        return {
            title: campaign.title,
            description: campaign.description,
            _links: {
                self: {
                    href: process.env.BASE_URL.concat("/osdi/org/",req.params.orgId,"/campaigns/", campaign.id,"/api/v1"),
                    title: campaign.title
                }
            }
        }


    })

    var response= {
        motd: "You must put your API Key in the custom headers box\nOSDI-API-Token: APIKEY",
        _embedded: {
            'osdi:campaigns': osdi_campaigns
        },
        links: {
            self: {
                href: process.env.BASE_URL.concat("/osdi/org/", req.orgId, "/campaigns")
            },
            curies: curies()
        }
    }

    res.send(response)
}

export async function chooser(req,res){
    res.status(200);
    const organizations = await r.knex('organization')

    var response= {
        motd: "You must an OSDI-API-Token header with your API key as the value, eg",
        "key_help": "OSDI-API-Token: YOURAPIKEY",
        _links: {
            org_campaign: {
                href: "/osdi/org/{orgId}/campaigns/{campaignId}/api/v1",
                templated: true
            }
        }
    }

    _.map(organizations, function(org) {
        var rel="".concat("spoke:org_", org.id)
        response._links[rel]={
            href: process.env.BASE_URL.concat("/api/v1/org/",org.id,"/campaigns")
        }
    })
    response._links['curies']=curies()

    res.send(response)
}

export async function campaignStats(req,res) {
    const orgId = req.params.orgId;
    const baseUrl="".concat(process.env.BASE_URL,req.baseUrl);

    if (await apiAuth.authShortCircuit(req, res, orgId)) {
        return
    }
    const campaignId = req.params.campaignId

    const [campaign] = await r
        .knex('campaign')
        .select()
        .where({ organization_id: orgId, id: campaignId })

    const contactCount = await r.getCount(
        r.knex('campaign_contact').where({ campaign_id: campaignId })
    );

    const resp= {
        stats: {
            title: campaign.title,
            contacts: contactCount,
            timezone: campaign.timezone
        },
        _links: {
            self: {
                href: baseUrl
            }
        }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(resp,null, 2))

}

function osdi_error(code, description) {
    const err={
        "osdi:error": {
            response_code: code,
            error_description: description
        }
    }
    return err;
}

function osdi_batch_error(invalids) {

    const err={
        request_type: "batch",
        response_code: 200,
        "batch_errors": [
            _.map(invalids, function(i) {
                return {
                    request_type: "non-atomic",
                    response_code: 400,
                    resource_status: [
                        {
                            resource: "osdi:person",
                            response_code: 400,
                            errors: [
                                {
                                    code: "INVALID DATA",
                                    input: i
                                }
                            ]
                        }
                    ]
                }
            })
        ]
    }
    return err;
}

function translate_success_to_import_helper_response(success,req) {
    var self_href="".concat(process.env.BASE_URL,
        req.baseUrl, "_import_result");

    var errors=success.invalid.length;
    var resp = {
        submitted: success.number_submitted,
        updated: success.dupes_in_campaign,
        created: success.added,
        errors: errors,
        "spoke:opted_out": success.opted_out,
        _links: {
            self: {
                href: self_href
            }
        }

    }
    if (errors > 0) {
        resp['osdi:error']=osdi_batch_error(success.invalid)
    }
    return resp;
}

async function getQuestionResponses(campaignContact) {
    const results = await r.knex('question_response as qres')
        .where('qres.campaign_contact_id', campaignContact.id)
        .join('interaction_step', 'qres.interaction_step_id', 'interaction_step.id')
        .join('interaction_step as child',
            'qres.interaction_step_id',
            'child.parent_interaction_id')
        .select('child.answer_option',
            'child.id',
            'child.parent_interaction_id',
            'child.created_at',
            'interaction_step.interaction_step_id',
            'interaction_step.campaign_id',
            'interaction_step.question',
            'interaction_step.script',
            'qres.id',
            'qres.value',
            'qres.created_at',
            'qres.interaction_step_id')
        .catch(log.error)

    return results;
}

export default {
    translate_contact_to_osdi_person,
    translate_osdi_person_to_input_row,
    AEP: AEP,
    chooser: chooser,
    digDug: digDug,
    campaignStats,
    osdi_error,
    osdi_batch_error,
    translate_success_to_import_helper_response,
    translate_message_to_osdi_message,
    translate_resource_to_osdi,
    spoke_to_osdi_type,
    osdiAEP,
    campaignChooser
}