import _ from 'lodash'
import apiAuth from '../../lib/api-auth'
import {r} from "../models";

export const digDug = (p, o) => {
    return p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);
};

function translate_osdi_person_to_input_row(person) {
    const mobile=digDug(['phone_numbers',0,'number'],person);
    const email=digDug(['email_addresses',0,'address'],person);
    const zip=digDug(['postal_addresses',0,'postal_code'],person);

    var row={
        first_name: person.given_name,
        last_name: person.family_name,
        email: email ? email : "",
        cell: mobile ? mobile : "",
        zip: zip ? zip : ""

    };

    console.log(row);
    return row;
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

    osdi._links= {
        self: {
            href: self_href,
            title: "".concat(contact['first_name'], " ", contact['last_name'])
        }
    };

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

    console.log("IN AEP");

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
                href: baseUrl.concat("/contacts"),
                title: "The People Collection"
            },
            "osdi:person_signup_helper":{
                href: baseUrl.concat("/contacts"),
                title: "Person signup Helper"
            },
            "osdi:people_import_helper": {
                href: baseUrl.concat("/contacts"),
                title: "People Import Helper"
            },
            "spoke:stats": {
                href: baseUrl.concat("/stats"),
                title: "Stats for this campaign"
            }
        },
        curies:  curies()
    };
    res.writeHead(200,{'Content-Type': 'application/json'});
    res.end(JSON.stringify(aep,null,2));
}


export async function chooser(req,res){
    res.status(200);
    res.send({
        motd: "You must demonstrate your political wisdom by finding your org and campaign",
        _links: {
            org_campaign: {
                href: "/osdi/org/{orgId}/campaigns/{campaignId}/api/v1",
                templated: true
            }
        },
        curies: curies()
    })
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

export default {
    translate_contact_to_osdi_person,
    translate_osdi_person_to_input_row,
    AEP: AEP,
    chooser: chooser,
    digDug: digDug,
    campaignStats,
    osdi_error
}