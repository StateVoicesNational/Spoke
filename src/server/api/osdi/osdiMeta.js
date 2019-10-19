import _ from 'lodash'
import apiAuth, {authStatusObject} from './api-auth'
import { r } from '../../models'
import { log } from '../../../lib'
import osdiUtil from './osdiUtil'



export async function getCampaign(req,res) {
    const campaignId = req.params.campaignId
    const orgId = req.params.orgId

    const [campaign] = await r
        .knex('campaign')
        .select()
        .where({organization_id: orgId, id: campaignId})

    if (!campaign) {
        res.writeHead(404)
        res.end('Not found')
        return
    }

    return campaign
}



export async function AEP(req, res) {

    const baseUrl="".concat(process.env.BASE_URL,req.baseUrl);

    const campaign = await getCampaign(req,res)

    const campaign_label = "".concat(campaign.title)

    if (!['GET'].includes(req.method)) {
        res.writeHead(405, { Allow: 'GET' });
        res.end('Not allowed');
        return
    }
    var aep={
        motd: "The '".concat(campaign_label, "' Spoke OSDI Endpoint"),
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
            "osdi:answers": {
                href: baseUrl.concat("/answers"),
                title: "The Answers (question responses) collection"
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
            curies:  osdiUtil.curies()
        }
    };
    log.info(JSON.stringify(aep))
    res.writeHead(200,{'Content-Type': osdiUtil.serverContentType()});
    res.end(JSON.stringify(aep,null,2));
}

export async function campaignChooser(req,res) {

    const orgId = req.params.orgId;
    if (await apiAuth.authShortCircuit(req, res, orgId)) {
        return
    }
    const organization = await r.knex('organization').where('id', orgId).first();

    const authStatus = await apiAuth.authStatus(req,res)

    const campaigns = await r
        .knex('campaign')
        .select()
        .where({organization_id: orgId})

    var osdi_campaigns= _.map(campaigns, function(campaign) {

        return {
            title: campaign.title,
            description: campaign.description,
            _links: {
                self: {
                    href: process.env.BASE_URL.concat("/osdi/org/",orgId,"/campaigns/", campaign.id,"/api/v1"),
                    title: campaign.title
                }
            }
        }


    })

    var response= {
        motd: "Welcome to ".concat(organization.name),
        _embedded: {
            'spoke:campaigns': osdi_campaigns
        },
        _links: {
            self: {
                href: process.env.BASE_URL.concat("/osdi/org/", req.orgId, "/campaigns")
            },
            curies: osdiUtil.curies()
        }
    }

    res.send(response)
}

export async function orgAEP(req,res) {
    const campaignsUrl="".concat(process.env.BASE_URL,"/osdi/org/", req.params.orgId, "/campaigns")

    const auth_status=await apiAuth.authStatusObject(req,res);
    const organization = await r.knex('organization').where('id', req.params.orgId).first();

    const motd= auth_status.authenticated ? "".concat("Welcome to ", organization.name, " You Are Authenticated") : "To" +
        " Authenticate," +
        " use an" +
        " OSDI-API-Token header" +
        " with your token in it.   Eg: OSDI-API-Token: mytokenisawesome";

    var response={
        motd: motd,
        current_auth_status: auth_status,
        _links: {
            'spoke:campaigns': {
                href: campaignsUrl
            }
        }


    }
    res.send(response)

}
export async function chooser(req,res){

    res.status(200);
    const organizations = await r.knex('organization')
    const osdi_organizations = _.filter(organizations,  function(o){
        return apiAuth.osdiEnabledForOrg(o)
    })

    var response= {
        motd: "Find the organization you are looking for",
        _links: {

        }
    }

    _.map(osdi_organizations, function(org) {
        var rel="".concat("spoke:org_", org.id)
        response._links[rel]={
            href: process.env.BASE_URL.concat("/osdi/org/",org.id)
        }
    })
    response._links['curies']=osdiUtil.curies()

    res.send(response)
}

export async function disabled(req,res) {
    const responseCode=510
    const statusMessage="OSDI Extensions disabled"

    res.writeHead(responseCode, statusMessage)
    var error={
        motd: statusMessage,
        "osdi:error": {
        response_code: responseCode,
        error_description: "OSDI Service is disabled by server configuration."

        },
        _links: {
            "spoke:osdi_setup": {
                title: "Consult your vehicle's user manual",
                href: "#"
            },
            curies: osdiUtil.curies()
        }
    }
    res.end(JSON.stringify(error,null, 2))
}


export default {
    AEP: AEP,
    chooser: chooser,
    campaignChooser,
    orgAEP,
    disabled

}